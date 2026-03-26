import torch
import torch.nn.functional as F

def pgd_attack_multimodal(model, input_ids, attention_mask, url_features, labels, eps=0.1, alpha=0.02, iters=5):
    """
    Custom PGD loop for the multimodal model.
    For simplicity, perturbing the continuous URL features.
    """
    model.eval()
    perturbed_urls = url_features.clone().detach()
    perturbed_urls.requires_grad = True
    
    for _ in range(iters):
        logits = model(input_ids, attention_mask, perturbed_urls)
        loss = F.binary_cross_entropy_with_logits(logits.squeeze(-1), labels.float())
        
        model.zero_grad()
        loss.backward()
        
        if perturbed_urls.grad is not None:
            adv_images = perturbed_urls + alpha * perturbed_urls.grad.sign()
            eta = torch.clamp(adv_images - url_features, min=-eps, max=eps)
            perturbed_urls = torch.clamp(url_features + eta, min=0).detach_()
            perturbed_urls.requires_grad = True
            
    model.train()
    return perturbed_urls
