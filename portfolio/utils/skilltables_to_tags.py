#!/usr/bin/env python
# coding: utf-8

"""
The script:
1. Processes tags from a CSV file where each tag can be included or not.
2. Populates a sphere of tags in an HTML file, marking included tags as 'visible'.
3. Writes processed tags in a JSON format to the files:
    - "../data/all_tags.json"
    - "../data/familiar_tags_draft.json"
    adding cleaned aliases to each tag's anchor.
"""

import pandas as pd
import json
import sys

# Input: CSV file path passed as an argument
if len(sys.argv) != 2:
    print("Usage: python script.py <table.csv>")
    sys.exit(1)

file_path = sys.argv[1]

# Columns for the table
columns = ["Tag", "Aliases_Tag", "Excluded", "Visible"]

# Read the CSV file
data = pd.read_csv(file_path, usecols=columns)
data = data[data['Excluded']!=1]

# Generate HTML lines and JSON mapping
html_lines = []
tags_mapping = []
html_lines.append(f'<ul class="tagcloud-tags" style="--num-elements: {len(data)}">')
for index, row in data.iterrows():
    tag = row['Tag'].strip()
    visible = row['Visible']
    aliases = row['Aliases_Tag'].strip().strip('[]').split(',') if pd.notna(row['Aliases_Tag']) else []
    aliases = [alias.strip() for alias in aliases]  # Strip leading/trailing spaces from each alias
    aliases.insert(0, tag)  # Add the primary tag as the first alias

    clean_tag = tag.replace("/", "").replace(" ", "-").lower()
    visibility_class = 'visible' if visible == 1 else ''
    line = f'  <li class="tagcloud-tag {visibility_class}" style="--index: {index+1}" data-tag="{clean_tag}"><div><a href="/concept-map/?tag={clean_tag}">{tag}</a></div></li>'
    html_lines.append(line)
    tags_mapping.append({"anchor": aliases, "tag": clean_tag})
html_lines.append("</ul>")

# Save to an HTML file
output_file = "../sphere_of_tags_content.html"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(html_lines))

print(f"HTML content generated and saved to {output_file}")

# Save included tags to JSON files
json_output_file = "../data/tags/all_tags.json"
with open(json_output_file, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)
    
json_output_file = "../data/tags/familiar_tags_draft.json"
with open(json_output_file, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)

print(f"Tags data saved to {json_output_file}")

