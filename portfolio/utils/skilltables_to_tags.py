#!/usr/bin/env python
# coding: utf-8

"""
The script:
1. Creates tags based on the Table1_cols and Table2_cols 
2. Populates sphere of tags ../sphere_of_tags_content.html with tags contained in Table1 and Table2 
3. Writes processed tags in a json format to the files:
    - "../data/all_tags.json"
    - "../data/familiar_tags_draft.json"
"""

import pandas as pd
import json
import sys

# Input: CSV file paths passed as arguments
if len(sys.argv) != 3:
    print("Usage: python script.py <table1.csv> <table2.csv>")
    sys.exit(1)

file1 = sys.argv[1]
file2 = sys.argv[2]

# Columns for each table
Table1_cols = ["Domain", "Specialization", "Incl Domain", "Incl Specialization"]
Table2_cols = ["Domain", "Subdomain", "Tool", "Incl Domain", "Incl Subdomain", "Incl Tool"]

# Read the CSV files
data1 = pd.read_csv(file1, usecols=Table1_cols)
data2 = pd.read_csv(file2, usecols=Table2_cols)

# Replace NaN values with 0 for inclusion flags
data1["Incl Domain"] = data1["Incl Domain"].fillna(0)
data1["Incl Specialization"] = data1["Incl Specialization"].fillna(0)
data2["Incl Domain"] = data2["Incl Domain"].fillna(0)
data2["Incl Subdomain"] = data2["Incl Subdomain"].fillna(0)
data2["Incl Tool"] = data2["Incl Tool"].fillna(0)

# Function to extract tags based on inclusion flags
def extract_tags(df, col_flags):
    tags = set()
    if "Incl Domain" in col_flags:
        tags.update(df[df["Incl Domain"] == 1]["Domain"])
    if "Incl Subdomain" in col_flags:
        tags.update(df[df["Incl Subdomain"] == 1]["Subdomain"])
    if "Incl Specialization" in col_flags:
        tags.update(df[df["Incl Specialization"] == 1]["Specialization"])
    if "Incl Tool" in col_flags:
        tags.update(df[df["Incl Tool"] == 1]["Tool"])
    return tags

# Extract tags from both tables
tags1 = extract_tags(data1, Table1_cols)
tags2 = extract_tags(data2, Table2_cols)

# Combine and remove duplicates
all_tags = sorted(tags1.union(tags2))

# Generate HTML lines and JSON mapping
html_lines = []
tags_mapping = []
html_lines.append(f'<ul class="tagcloud-tags" style="--num-elements: {len(all_tags)}">')
for k, v in enumerate(all_tags):
    tag = v.replace("/", "").replace(" ", "-").lower()
    line = f'  <li class="tagcloud-tag" style="--index: {k+1}" data-tag="{tag}"><div><a href="/concept-map/?tag={tag}">{v}</a></div></li>'
    html_lines.append(line)
    tags_mapping.append({"anchor": v, "tag": tag})
html_lines.append("</ul>")

# Save to an HTML file
output_file = "../sphere_of_tags_content.html"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(html_lines))

print(f"HTML content generated and saved to {output_file}")

# Save all_tags to a JSON file
json_output_file = "../data/all_tags.json"
with open(json_output_file, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)
    
json_output_file = "../data/familiar_tags_draft.json"
with open(json_output_file, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)

print(f"Tags data saved to {json_output_file}")


