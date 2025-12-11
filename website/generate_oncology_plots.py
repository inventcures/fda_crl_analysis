import json
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import numpy as np
import os

INPUT_FILE = 'public/data/enriched_manual_oncology.json'
OUTPUT_DIR = 'public/images/oncology'

def generate_plots():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)

    # Prepare Data
    records = []
    for drug in data:
        name = drug['drug_name']
        status = drug['approval_status']
        targets = drug.get('enriched', {}).get('targets', [])
        
        # Focus on the PRIMARY target (usually the first one or one with highest association)
        # For simplicity, we take the first one that has data, or aggregate
        for t in targets:
            # Get Constraint Scores (LOF - Loss of Function)
            lof_score = 0
            mis_score = 0
            if t.get('genetic_constraint'):
                for c in t['genetic_constraint']:
                    if c['constraintType'] == 'lof':
                        lof_score = c['oe'] # Observed/Expected ratio (lower = more constrained)
                    if c['constraintType'] == 'mis':
                        mis_score = c['oe']
            
            # Get Association Score
            assoc_score = 0
            if t.get('oncology_evidence'):
                assoc_score = t['oncology_evidence']['overall_association_score']
                
            # Count Hallmarks
            hallmark_count = len(t.get('cancer_hallmarks', []))
            
            records.append({
                'Drug': name,
                'Status': status,
                'Target': t['symbol'],
                'LOF_OE': lof_score,
                'Missense_OE': mis_score,
                'Association_Score': assoc_score,
                'Hallmarks': hallmark_count
            })
    
    df = pd.DataFrame(records)
    
    # 1. Association Scores Bar Chart
    plt.figure(figsize=(10, 6))
    sns.barplot(data=df, x='Target', y='Association_Score', hue='Drug', dodge=False)
    plt.title('Target-Disease Association Scores (Open Targets)')
    plt.ylabel('Association Score (0-1)')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/target_association_scores.png')
    plt.close()

    # 2. Genetic Constraint (LOF OE)
    # Lower LOF OE means the gene is intolerant to loss of function (essential)
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=df, x='Target', y='LOF_OE', hue='Drug', s=200, style='Status')
    plt.title('Genetic Constraint: Loss-of-Function Observed/Expected Ratio')
    plt.ylabel('LOF Observed/Expected (Lower = More Constrained)')
    plt.axhline(y=0.35, color='r', linestyle='--', label='Highly Constrained (<0.35)')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/genetic_constraint_comparison.png')
    plt.close()
    
    # 3. Hallmarks Heatmap
    # Pivot data for heatmap
    if not df.empty:
        pivot_df = df.pivot_table(index='Drug', columns='Target', values='Hallmarks', fill_value=0)
        plt.figure(figsize=(8, 6))
        sns.heatmap(pivot_df, annot=True, cmap='Blues', cbar_kws={'label': 'Count of Associated Cancer Hallmarks'})
        plt.title('Cancer Hallmarks Coverage by Target')
        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/hallmarks_heatmap.png')
        plt.close()
    
    print("Plots generated in public/images/oncology/")

if __name__ == "__main__":
    generate_plots()
