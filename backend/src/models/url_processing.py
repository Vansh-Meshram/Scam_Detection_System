"""
Advanced URL Feature Extractor - 18 Features
Replaces the old 8-feature url_featurizer.py
"""

import re
import math
import string
import socket
from urllib.parse import urlparse
from collections import Counter
from datetime import datetime, timezone

import tldextract
from cachetools import TTLCache

# ── Optional imports (graceful fallback) ─────────────────────
try:
    import whois
    HAS_WHOIS = True
except ImportError:
    HAS_WHOIS = False

try:
    import dns.resolver
    HAS_DNS = True
except ImportError:
    HAS_DNS = False

try:
    import ssl
    import OpenSSL
    HAS_SSL = True
except ImportError:
    HAS_SSL = False

try:
    from Levenshtein import distance as lev_distance
    HAS_LEVENSHTEIN = True
except ImportError:
    HAS_LEVENSHTEIN = False


class EnhancedURLFeaturizer:
    """Extracts 18 advanced features from a URL string."""

    # ── Well-known brands for typosquatting detection ────────
    KNOWN_BRANDS = [
        "google", "facebook", "apple", "amazon", "microsoft",
        "netflix", "paypal", "instagram", "twitter", "linkedin",
        "yahoo", "ebay", "chase", "wellsfargo", "bankofamerica",
        "dropbox", "spotify", "adobe", "zoom", "slack",
        "github", "walmart", "target", "costco", "bestbuy",
    ]

    # ── Suspicious TLDs commonly abused in phishing ──────────
    SUSPICIOUS_TLDS = {
        "tk", "ml", "ga", "cf", "gq", "xyz", "top", "club",
        "work", "buzz", "surf", "icu", "cam", "monster",
        "rest", "fit", "beauty", "hair", "quest", "zip", "mov",
    }

    def __init__(self, cache_ttl: int = 3600, cache_maxsize: int = 10000):
        self._whois_cache = TTLCache(maxsize=cache_maxsize, ttl=cache_ttl)
        self._ssl_cache   = TTLCache(maxsize=cache_maxsize, ttl=cache_ttl)

    # ══════════════════════════════════════════════════════════
    #  PUBLIC API
    # ══════════════════════════════════════════════════════════

    def extract_features(self, url: str) -> dict:
        """
        Extract all 18 features from a URL.

        Returns dict with keys:
          Lexical (10):
            url_length, domain_length, num_dots, num_hyphens,
            num_digits, digit_ratio, has_ip, has_at,
            url_entropy, is_suspicious_tld
          Domain Reputation (2):
            domain_age_days, is_new_domain
          SSL (2):
            has_https, has_valid_ssl
          Brand Similarity (2):
            min_brand_distance, is_typosquatting
          Structure (2):
            num_subdomains, brand_in_subdomain
        """
        parsed = urlparse(url if "://" in url else f"http://{url}")
        extracted = tldextract.extract(url)

        domain   = extracted.domain or ""
        suffix   = extracted.suffix or ""
        fqdn     = extracted.fqdn   or parsed.netloc
        subdomain = extracted.subdomain or ""

        features = {}

        # ── 1-10  Lexical ────────────────────────────────────
        features.update(self._lexical_features(url, parsed, domain, suffix))

        # ── 11-12 Domain Reputation ──────────────────────────
        features.update(self._domain_reputation(fqdn))

        # ── 13-14 SSL ────────────────────────────────────────
        features.update(self._ssl_features(url, fqdn))

        # ── 15-16 Brand Similarity ───────────────────────────
        features.update(self._brand_similarity(domain))

        # ── 17-18 Structure ──────────────────────────────────
        features.update(self._structure_features(subdomain, domain))

        return features

    def features_to_array(self, features: dict) -> list:
        """Convert feature dict → list of 18 floats (fixed order)."""
        keys = [
            # Lexical
            "url_length", "domain_length", "num_dots", "num_hyphens",
            "num_digits", "digit_ratio", "has_ip", "has_at",
            "url_entropy", "is_suspicious_tld",
            # Domain reputation
            "domain_age_days", "is_new_domain",
            # SSL
            "has_https", "has_valid_ssl",
            # Brand similarity
            "min_brand_distance", "is_typosquatting",
            # Structure
            "num_subdomains", "brand_in_subdomain",
        ]
        return [float(features.get(k, 0.0)) for k in keys]

    # ══════════════════════════════════════════════════════════
    #  FEATURE GROUPS (private)
    # ══════════════════════════════════════════════════════════

    def _lexical_features(self, url, parsed, domain, suffix):
        """Features 1-10: computed from URL string alone."""
        url_length   = len(url)
        domain_len   = len(domain)
        num_dots     = url.count(".")
        num_hyphens  = url.count("-")
        num_digits   = sum(c.isdigit() for c in url)
        digit_ratio  = num_digits / max(url_length, 1)

        # IP address instead of domain?
        has_ip = 0.0
        try:
            socket.inet_aton(parsed.hostname or "")
            has_ip = 1.0
        except (socket.error, TypeError):
            has_ip = 1.0 if re.search(
                r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", url
            ) else 0.0

        has_at = 1.0 if "@" in url else 0.0

        # Shannon entropy
        url_entropy = self._shannon_entropy(url)

        is_suspicious = 1.0 if suffix.lower() in self.SUSPICIOUS_TLDS else 0.0

        return {
            "url_length":        url_length,
            "domain_length":     domain_len,
            "num_dots":          num_dots,
            "num_hyphens":       num_hyphens,
            "num_digits":        num_digits,
            "digit_ratio":       digit_ratio,
            "has_ip":            has_ip,
            "has_at":            has_at,
            "url_entropy":       url_entropy,
            "is_suspicious_tld": is_suspicious,
        }

    def _domain_reputation(self, fqdn: str):
        """Features 11-12: WHOIS-based domain age."""
        age_days = -1.0
        is_new  = 1.0  # assume worst case

        if not HAS_WHOIS:
            return {"domain_age_days": age_days, "is_new_domain": is_new}

        if fqdn in self._whois_cache:
            age_days = self._whois_cache[fqdn]
        else:
            try:
                w = whois.whois(fqdn)
                creation = w.creation_date
                if isinstance(creation, list):
                    creation = creation[0]
                if creation:
                    delta = datetime.now(timezone.utc) - creation.replace(
                        tzinfo=timezone.utc
                    )
                    age_days = delta.days
            except Exception:
                age_days = -1.0
            self._whois_cache[fqdn] = age_days

        if age_days >= 0:
            is_new = 1.0 if age_days < 30 else 0.0

        return {"domain_age_days": age_days, "is_new_domain": is_new}

    def _ssl_features(self, url: str, fqdn: str):
        """Features 13-14: HTTPS & SSL validity."""
        has_https = 1.0 if url.lower().startswith("https") else 0.0
        has_valid_ssl = 0.0

        if not HAS_SSL or not has_https:
            return {"has_https": has_https, "has_valid_ssl": has_valid_ssl}

        if fqdn in self._ssl_cache:
            has_valid_ssl = self._ssl_cache[fqdn]
        else:
            try:
                ctx = ssl.create_default_context()
                with ctx.wrap_socket(
                    socket.socket(), server_hostname=fqdn
                ) as s:
                    s.settimeout(5)
                    s.connect((fqdn, 443))
                    cert = s.getpeercert()
                    if cert:
                        has_valid_ssl = 1.0
            except Exception:
                has_valid_ssl = 0.0
            self._ssl_cache[fqdn] = has_valid_ssl

        return {"has_https": has_https, "has_valid_ssl": has_valid_ssl}

    def _brand_similarity(self, domain: str):
        """Features 15-16: Levenshtein distance to known brands."""
        if not HAS_LEVENSHTEIN or not domain:
            return {"min_brand_distance": 99.0, "is_typosquatting": 0.0}

        domain_lower = domain.lower()
        min_dist = 99
        for brand in self.KNOWN_BRANDS:
            if brand == domain_lower:
                min_dist = 0
                break
            d = lev_distance(domain_lower, brand)
            if d < min_dist:
                min_dist = d

        is_typo = 1.0 if 0 < min_dist <= 2 else 0.0
        return {"min_brand_distance": float(min_dist), "is_typosquatting": is_typo}

    def _structure_features(self, subdomain: str, domain: str):
        """Features 17-18: subdomain structure."""
        num_subdomains = len(subdomain.split(".")) if subdomain else 0
        brand_in_sub   = 0.0

        if subdomain:
            sub_lower = subdomain.lower()
            for brand in self.KNOWN_BRANDS:
                if brand in sub_lower:
                    brand_in_sub = 1.0
                    break

        return {"num_subdomains": num_subdomains, "brand_in_subdomain": brand_in_sub}

    # ══════════════════════════════════════════════════════════
    #  UTILITIES
    # ══════════════════════════════════════════════════════════

    @staticmethod
    def _shannon_entropy(text: str) -> float:
        """Shannon entropy of a string."""
        if not text:
            return 0.0
        counts = Counter(text)
        length = len(text)
        entropy = 0.0
        for count in counts.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy