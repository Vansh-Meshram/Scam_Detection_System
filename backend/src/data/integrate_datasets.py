import pandas as pd
import os

def load_and_transform_emails(filepath):
    print("Loading emails.csv...")
    try:
        # Based on previous analysis, we need sep='\t' and to skip bad lines
        df = pd.read_csv(filepath, sep='\t', on_bad_lines='skip', low_memory=False)
        
        # Select and rename relevant columns
        transformed_df = pd.DataFrame()
        
        if 'text' in df.columns:
            transformed_df['text'] = df['text']
        else:
            print("Warning: 'text' column not found in emails.csv")
            
        if 'binary_label' in df.columns:
            transformed_df['label'] = df['binary_label']
        else:
            print("Warning: 'binary_label' column not found in emails.csv")
            
        if 'detailed_category' in df.columns:
            transformed_df['detailed_label'] = df['detailed_category']
        else:
            print("Warning: 'detailed_category' column not found in emails.csv")
            
        transformed_df['source'] = 'email'
        
        print(f"Loaded {len(transformed_df)} email records.")
        return transformed_df
    except Exception as e:
        print(f"Error loading emails: {e}")
        return pd.DataFrame()

def load_and_transform_msg(filepath):
    print("Loading msg.csv...")
    try:
        # Load messages. It was tab separated as well based on explore_labels
        df = pd.read_csv(filepath, sep='\t', encoding='latin-1')
        
        transformed_df = pd.DataFrame()
        
        if 'v2' in df.columns:
            transformed_df['text'] = df['v2']
        else:
            print("Warning: 'v2' column not found in msg.csv")
            
        if 'v1' in df.columns:
            # spam -> 1, ham -> 0
            transformed_df['label'] = df['v1'].map({'spam': 1, 'ham': 0})
            # Add prefix to detailed label
            transformed_df['detailed_label'] = 'sms_' + df['v1'].astype(str)
        else:
            print("Warning: 'v1' column not found in msg.csv")
            
        transformed_df['source'] = 'sms'
        
        print(f"Loaded {len(transformed_df)} sms records.")
        return transformed_df
    except Exception as e:
        print(f"Error loading msgs: {e}")
        return pd.DataFrame()

def load_and_transform_url(filepath):
    print("Loading url.csv...")
    try:
        df = pd.read_csv(filepath, sep='\t')
        
        transformed_df = pd.DataFrame()
        
        if 'url' in df.columns:
            transformed_df['text'] = df['url']
        else:
            print("Warning: 'url' column not found in url.csv")
            
        if 'type' in df.columns:
            # benign -> 0, anything else -> 1
            transformed_df['label'] = df['type'].apply(lambda x: 0 if x == 'benign' else 1)
            transformed_df['detailed_label'] = df['type']
        else:
            print("Warning: 'type' column not found in url.csv")
            
        transformed_df['source'] = 'url'
        
        print(f"Loaded {len(transformed_df)} url records.")
        return transformed_df
    except Exception as e:
        print(f"Error loading urls: {e}")
        return pd.DataFrame()

def integrate_datasets(data_dir):
    emails_path = os.path.join(data_dir, 'emails.csv')
    msg_path = os.path.join(data_dir, 'msg.csv')
    url_path = os.path.join(data_dir, 'url.csv')
    
    dfs = []
    
    df_emails = load_and_transform_emails(emails_path)
    if not df_emails.empty:
        dfs.append(df_emails)
        
    df_msg = load_and_transform_msg(msg_path)
    if not df_msg.empty:
        dfs.append(df_msg)
        
    df_url = load_and_transform_url(url_path)
    if not df_url.empty:
        dfs.append(df_url)
        
    if dfs:
        print("Concatenating datasets...")
        combined_df = pd.concat(dfs, ignore_index=True)
        
        # Optional: clean up any rows with missing essential data
        initial_len = len(combined_df)
        combined_df.dropna(subset=['text', 'label'], inplace=True)
        if len(combined_df) < initial_len:
            print(f"Dropped {initial_len - len(combined_df)} rows with missing text or label.")
            
        output_path = os.path.join(data_dir, 'combined_dataset.csv')
        print(f"Saving combined dataset to {output_path}...")
        combined_df.to_csv(output_path, index=False)
        print(f"Successfully saved {len(combined_df)} records.")
        
        print("\nDataset Summary:")
        print(combined_df['source'].value_counts())
        print("\nLabel Distribution:")
        print(combined_df['label'].value_counts())
        print("\nDetailed Label Distribution:")
        print(combined_df['detailed_label'].value_counts().head(10))
    else:
        print("No datasets were successfully loaded.")

if __name__ == "__main__":
    # Ensure this runs from the correct root directory
    data_directory = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
    data_directory = os.path.abspath(data_directory)
    
    if os.path.exists(data_directory):
         integrate_datasets(data_directory)
    else:
         print(f"Data directory not found at {data_directory}")
