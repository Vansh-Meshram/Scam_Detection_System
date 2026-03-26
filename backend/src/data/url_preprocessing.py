"""
Enhanced URL Feature Extraction — 18 advanced features.
Covers lexical, domain reputation, SSL, brand similarity, and structure analysis.
"""

import re
import math
import socket
import ssl
from urllib.parse import urlparse
from collections import Counter

import tldextract
from cachetools import TTLCache

# ── Optional imports (graceful degradation) ───────────────────
try:
    import whois as python_whois
    HAS_WHOIS = True
except ImportError:
    HAS_WHOIS = False

try:
    from Levenshtein import distance as levenshtein_distance
    HAS_LEVENSHTEIN = True
except ImportError:
    HAS_LEVENSHTEIN = False


# ── Constants ─────────────────────────────────────────────────

KNOWN_BRANDS = [
    "paypal", "google", "apple", "microsoft", "amazon",
    "netflix", "facebook", "instagram", "twitter", "linkedin",
    "chase", "wellsfargo", "bankofamerica", "citibank",
    "dropbox", "adobe",
]

SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top",
    "buzz", "club", "work", "info",
}

FEATURE_NAMES = [
    # Lexical (10)
    "url_length",
    "domain_length",
    "num_dots",
    "num_hyphens",
    "num_digits",
    "digit_ratio",
    "has_ip",
    "has_at",
    "url_entropy",
    "is_suspicious_tld",
    # Domain Reputation (2)
    "domain_age_days",
    "is_new_domain",
    # SSL (2)
    "has_https",
    "has_valid_ssl",
    # Brand Similarity (2)
    "min_brand_distance",
    "is_typosquatting",
    # Structure (2)
    "num_subdomains",
    "brand_in_subdomain",
]

# ── WHOIS cache ───────────────────────────────────────────────
_whois_cache: TTLCache = TTLCache(maxsize=1000, ttl=3600)


class EnhancedURLFeaturizer:
    """
    Extracts 18 advanced features from a URL string.

    Categories:
        Lexical (10)  · Domain Reputation (2)  · SSL (2)
        Brand Similarity (2)  · Structure (2)
    """

    def __init__(self, skip_network: bool = False):
        self.feature_names = list(FEATURE_NAMES)
        self.skip_network = skip_network

    # ──────────────────────────────────────────────────────────
    #  Public API
    # ──────────────────────────────────────────────────────────

    def get_feature_names(self) -> list:
        """Return ordered list of the 18 feature names."""
        return list(self.feature_names)

    def extract_features(self, url: str) -> dict:
        """Extract all 18 features from *url* and return as a dict."""
        if not isinstance(url, str) or not url.strip():
            return {name: 0.0 for name in self.feature_names}

        url = url.strip()
        parsed = urlparse(url)
        ext = tldextract.extract(url)
        registered_domain = ext.domain  # e.g. "paypa1" from paypa1-verify.tk

        features: dict = {}

        # ── Lexical (10) ─────────────────────────────────────
        features["url_length"] = float(len(url))
        features["domain_length"] = float(len(registered_domain))
        features["num_dots"] = float(url.count("."))
        features["num_hyphens"] = float(url.count("-"))

        n_digits = sum(c.isdigit() for c in url)
        features["num_digits"] = float(n_digits)
        features["digit_ratio"] = n_digits / max(len(url), 1)

        ip_pat = r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
        features["has_ip"] = 1.0 if re.search(ip_pat, url) else 0.0
        features["has_at"] = 1.0 if "@" in url else 0.0
        features["url_entropy"] = self._shannon_entropy(url)

        tld = ext.suffix.lower() if ext.suffix else ""
        features["is_suspicious_tld"] = 1.0 if tld in SUSPICIOUS_TLDS else 0.0

        # ── Domain Reputation (2) ────────────────────────────
        if self.skip_network:
            features["domain_age_days"] = 0.0
            features["is_new_domain"] = 1.0
        else:
            raw_age_days = self._get_domain_age_days(ext.registered_domain or "")
            if raw_age_days is not None:
                features["domain_age_days"] = min(raw_age_days / 365.0, 10.0) / 10.0
                features["is_new_domain"] = 1.0 if raw_age_days < 30 else 0.0
            else:
                features["domain_age_days"] = 0.0
                features["is_new_domain"] = 1.0  # worst-case assumption

        # ── SSL (2) ──────────────────────────────────────────
        features["has_https"] = 1.0 if url.lower().startswith("https") else 0.0
        if self.skip_network:
            features["has_valid_ssl"] = 0.0
        else:
            features["has_valid_ssl"] = self._check_ssl(
                ext.registered_domain or parsed.hostname or ""
            )

        # ── Brand Similarity (2) ─────────────────────────────
        raw_distance, norm_distance = self._brand_similarity(registered_domain)
        features["min_brand_distance"] = norm_distance
        features["is_typosquatting"] = (
            1.0
            if raw_distance <= 2 and registered_domain.lower() not in KNOWN_BRANDS
            else 0.0
        )

        # ── Structure (2) ────────────────────────────────────
        subdomain = ext.subdomain or ""
        sub_parts = [p for p in subdomain.split(".") if p]
        features["num_subdomains"] = float(len(sub_parts))

        brand_in_sub = any(
            brand in subdomain.lower()
            for brand in KNOWN_BRANDS
        ) and not any(brand == registered_domain.lower() for brand in KNOWN_BRANDS)
        features["brand_in_subdomain"] = 1.0 if brand_in_sub else 0.0

        return features

    def features_to_array(self, features_dict: dict) -> list:
        """Convert feature dict → ordered list of 18 floats."""
        return [float(features_dict.get(name, 0.0)) for name in self.feature_names]

    # ──────────────────────────────────────────────────────────
    #  Private helpers
    # ──────────────────────────────────────────────────────────

    @staticmethod
    def _shannon_entropy(text: str) -> float:
        """Shannon entropy of the character distribution in *text*."""
        if not text:
            return 0.0
        counts = Counter(text)
        length = len(text)
        return -sum(
            (count / length) * math.log2(count / length)
            for count in counts.values()
        )

    @staticmethod
    def _get_domain_age_days(domain: str):
        """
        Return domain age in days via WHOIS, or None on failure.
        Results are cached for 1 hour.
        """
        if not domain or not HAS_WHOIS:
            return None

        if domain in _whois_cache:
            return _whois_cache[domain]

        try:
            w = python_whois.whois(domain)
            creation = w.creation_date
            if isinstance(creation, list):
                creation = creation[0]
            if creation is None:
                _whois_cache[domain] = None
                return None

            from datetime import datetime, timezone

            now = datetime.now(timezone.utc)
            if creation.tzinfo is None:
                from datetime import timezone as _tz
                creation = creation.replace(tzinfo=_tz.utc)
            age_days = (now - creation).days
            _whois_cache[domain] = age_days
            return age_days
        except Exception:
            _whois_cache[domain] = None
            return None

    @staticmethod
    def _check_ssl(hostname: str) -> float:
        """Return 1.0 if *hostname* has a valid SSL certificate, else 0.0."""
        if not hostname:
            return 0.0
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname):
                    return 1.0
        except Exception:
            return 0.0

    @staticmethod
    def _brand_similarity(domain: str):
        """
        Return (raw_min_distance, normalised_similarity) against KNOWN_BRANDS.

        normalised_similarity = 1 - min(distance / max_len, 1.0)
          where max_len = max(len(domain), len(brand))

        Falls back to (999, 0.0) when Levenshtein is unavailable.
        """
        if not domain or not HAS_LEVENSHTEIN:
            return 999, 0.0

        domain_lower = domain.lower()
        min_dist = float("inf")
        best_norm = 0.0

        for brand in KNOWN_BRANDS:
            dist = levenshtein_distance(domain_lower, brand)
            max_len = max(len(domain_lower), len(brand))
            norm = 1.0 - min(dist / max_len, 1.0) if max_len else 0.0
            if dist < min_dist:
                min_dist = dist
                best_norm = norm

        return int(min_dist), best_norm
