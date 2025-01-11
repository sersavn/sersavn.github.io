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
import math  # Added import for mathematical operations

# Input: CSV file path passed as an argument
if len(sys.argv) != 2:
    print("Usage: python script.py <table.csv>")
    sys.exit(1)

file_path = sys.argv[1]

# Columns for the table
columns = ["Tag", "Aliases_Tag", "Excluded", "Visible"]

# Read the CSV file
data = pd.read_csv(file_path, usecols=columns)
data = data[data['Excluded'] != 1]

# Separate visible and non-visible tags
visible_tags = data[data['Visible'] == 1].copy()
non_visible_tags = data[data['Visible'] != 1].copy()

total_tags = len(visible_tags) + len(non_visible_tags)

if len(visible_tags) == 0:
    print("No visible tags found.")
    sys.exit(1)

# Calculate n based on the formula
n = (len(non_visible_tags)) / (len(visible_tags) + 1)
n = math.floor(n) if n >=1 else 0  # Ensure n is an integer and at least 0

print(f"Total Tags: {total_tags}, Visible Tags: {len(visible_tags)}, Non-Visible Tags: {len(non_visible_tags)}, n: {n}")

# Generate HTML lines with even distribution
html_lines = []
tags_mapping = []
html_lines.append(f'<ul class="tagcloud-tags" style="--num-elements: {total_tags}">')

visible_iter = visible_tags.iterrows()
non_visible_iter = non_visible_tags.iterrows()

try:
    current_visible = next(visible_iter)
except StopIteration:
    current_visible = None

current_index = 1  # Initialize a separate index counter

for i in range(len(non_visible_tags)):
    index, row = non_visible_tags.iloc[i].name, non_visible_tags.iloc[i]
    tag = row['Tag'].strip()
    visible = row['Visible']
    aliases = row['Aliases_Tag'].strip().strip('[]').split(',') if pd.notna(row['Aliases_Tag']) else []
    aliases = [alias.strip() for alias in aliases]  # Strip leading/trailing spaces from each alias
    aliases.insert(0, tag)  # Add the primary tag as the first alias

    clean_tag = tag.replace("/", "").replace(" ", "-").lower()
    visibility_class = 'visible' if visible == 1 else ''
    
    # Assign integer index using current_index and increment
    line = f'  <li class="tagcloud-tag {visibility_class}" style="--index: {current_index}" data-tag="{clean_tag}"><div><a href="/concept-map/?tag={clean_tag}">{tag}</a></div></li>'
    html_lines.append(line)
    tags_mapping.append({"anchor": aliases, "tag": clean_tag})
    current_index += 1  # Increment the index counter

    # Insert a visible tag after every n non-visible tags
    if n > 0 and (i + 1) % n == 0 and current_visible:
        v_index, v_row = current_visible
        v_tag = v_row['Tag'].strip()
        v_aliases = v_row['Aliases_Tag'].strip().strip('[]').split(',') if pd.notna(v_row['Aliases_Tag']) else []
        v_aliases = [alias.strip() for alias in v_aliases]
        v_aliases.insert(0, v_tag)

        v_clean_tag = v_tag.replace("/", "").replace(" ", "-").lower()
        v_visibility_class = 'visible'
        
        # Assign integer index using current_index and increment
        v_line = f'  <li class="tagcloud-tag {v_visibility_class}" style="--index: {current_index}" data-tag="{v_clean_tag}"><div><a href="/concept-map/?tag={v_clean_tag}">{v_tag}</a></div></li>'
        html_lines.append(v_line)
        tags_mapping.append({"anchor": v_aliases, "tag": v_clean_tag})
        current_index += 1  # Increment the index counter

        try:
            current_visible = next(visible_iter)
        except StopIteration:
            current_visible = None

# If any visible tags remain, append them at the end
while current_visible:
    v_index, v_row = current_visible
    v_tag = v_row['Tag'].strip()
    v_aliases = v_row['Aliases_Tag'].strip().strip('[]').split(',') if pd.notna(v_row['Aliases_Tag']) else []
    v_aliases = [alias.strip() for alias in v_aliases]
    v_aliases.insert(0, v_tag)

    v_clean_tag = v_tag.replace("/", "").replace(" ", "-").lower()
    v_visibility_class = 'visible'
    
    # Assign integer index using current_index and increment
    v_line = f'  <li class="tagcloud-tag {v_visibility_class}" style="--index: {current_index}" data-tag="{v_clean_tag}"><div><a href="/concept-map/?tag={v_clean_tag}">{v_tag}</a></div></li>'
    html_lines.append(v_line)
    tags_mapping.append({"anchor": v_aliases, "tag": v_clean_tag})
    current_index += 1  # Increment the index counter

    try:
        current_visible = next(visible_iter)
    except StopIteration:
        current_visible = None

html_lines.append("</ul>")

# Save to an HTML file
output_file = "../sphere_of_tags_content.html"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(html_lines))

print(f"HTML content generated and saved to {output_file}")

# Save included tags to JSON files
json_output_file_all = "../data/tags/all_tags.json"
with open(json_output_file_all, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)

json_output_file_familiar = "../data/tags/familiar_tags_draft.json"
with open(json_output_file_familiar, "w", encoding="utf-8") as json_file:
    json.dump(tags_mapping, json_file, indent=4)

print(f"Tags data saved to {json_output_file_familiar}")

