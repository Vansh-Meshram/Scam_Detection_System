# Google Colab GPU Training Guide
This guide explains how to train the ScamGuard AI model efficiently using Google Colab's free T4 GPU.

## Phase 1: Prepare Your Files Locally
1. Stop any local `train.py` scripts running on your computer.
2. In your File Explorer, navigate to your project folder: `scam_detection_system`.
3. Select three items: your `data` folder, your `src` folder, and your `requirements.txt` file.
4. Right-click them and select **Compress to ZIP file**. Name the zip file `project_for_colab.zip`.

## Phase 2: Setup Google Colab
1. Go to [Google Colab](https://colab.research.google.com/) and sign in with your Google account.
2. Click **New Notebook**.
3. In the new notebook, go to the top menu and select **Runtime** > **Change runtime type**.
4. Under the "Hardware accelerator" dropdown, select **T4 GPU** and click **Save**. 

## Phase 3: Upload and Train
1. On the far-left sidebar of Colab, click the **Folder icon** to open the files panel. 
2. Drag and drop your `project_for_colab.zip` file into that files panel to upload it.
3. **IMPORTANT**: Look at the orange progress circle at the bottom. **Wait for the upload to 100% finish before running anything!** (This takes a few minutes because the dataset is quite large).
4. Once the circle disappears, create a code cell, paste this command to unzip your files, and hit "Play":
   ```bash
   !unzip -q project_for_colab.zip
   ```
5. Create a new code cell, paste this command to install the dependencies, and run it:
   ```bash
   !pip install -r requirements.txt
   ```
6. Create one last code cell, paste this training command, and run it. Notice we use a higher batch-size of 16 to take advantage of the 16GB GPU memory!
   ```bash
   !PYTHONPATH="." python src/training/train.py --epochs 2 --batch-size 16
   ```

## Phase 4: Retrieve the Brain!
1. Once the training completes, you will see it output lines like `"Total params: 195M | Trainable: 11M"` and `"Best model saved"`. 
2. In the left-side files panel, open the newly generated **`models`** folder.
3. Hover over **`phishing_detector.pt`**, click the three dots `⋮` on the right side of the filename, and click **Download**. 
4. Do the exact same for **`url_vocab.json`**.
5. Move both of these downloaded files into your local project's `models/` folder.

Next time you start your local `uvicorn` API, it will load these custom-trained GPU weights!
