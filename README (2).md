# Pix2Pix SAR to RGB Image Translation

## Overview
This project implements a Pix2Pix Conditional Generative Adversarial Network (cGAN) to translate Synthetic Aperture Radar (SAR) images into RGB images. SAR images are difficult to interpret visually, and this model helps convert them into human-readable RGB representations using supervised image-to-image translation.

---

## Problem Statement
SAR images are radar-based grayscale images commonly used in remote sensing. While they contain rich structural information, they are not intuitive for human analysis. The goal of this project is to automatically generate realistic RGB images from SAR inputs using deep learning.

---

## Approach
- Uses a **Pix2Pix conditional GAN**
- Trains on **paired SAR–RGB images**
- Generator uses a **U-Net architecture**
- Discriminator uses a **PatchGAN architecture**
- Combines **adversarial loss** and **L1 loss** for stable training

---

## Model Architecture

### Generator
- Encoder–decoder (U-Net)
- Skip connections preserve spatial details
- Outputs RGB images from SAR inputs

### Discriminator
- PatchGAN classifier
- Evaluates local image patches for realism

---

## Dataset
- Paired SAR and RGB images
- Each image is split into:
  - Input: SAR image
  - Target: RGB image
- Images are resized and normalized for training

---

## Training
- Generator and discriminator are trained simultaneously
- Loss functions:
  - Adversarial loss for realism
  - L1 loss for structural accuracy
- Training is performed using TensorFlow

---

## Results
The trained model successfully generates visually meaningful RGB images from SAR inputs. Performance is evaluated through side-by-side visual comparisons of SAR input, generated RGB output, and ground truth RGB images.

---

## Limitations
- Requires paired SAR–RGB datasets
- Performance depends on data quality
- May not generalize well to unseen sensor conditions

---

## Future Improvements
- Use unpaired translation (CycleGAN)
- Improve generalization with data augmentation
- Add quantitative evaluation metrics (SSIM, PSNR)

---

## Technologies Used
- Python
- TensorFlow / Keras
- NumPy
- Matplotlib

---

## Author
Siddhi 

