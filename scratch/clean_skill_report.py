import re

filepath = "/Users/nafadza/Documents/zieads/zieads-AI-Agent--main/src/pages/SkillReport.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace Platform Colors definition
platform_colors_old = """const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  meta: { bg: '#1877F2', text: '#fff', label: 'Meta' },
  facebook: { bg: '#1877F2', text: '#fff', label: 'Facebook' },
  instagram: { bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', text: '#fff', label: 'Instagram' },
  google: { bg: '#4285F4', text: '#fff', label: 'Google' },
  tiktok: { bg: '#000', text: '#fff', label: 'TikTok' },
  linkedin: { bg: '#0077B5', text: '#fff', label: 'LinkedIn' },
  youtube: { bg: '#FF0000', text: '#fff', label: 'YouTube' },
};"""

platform_colors_new = """const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  meta: { bg: 'var(--primary)', text: '#fff', label: 'Meta' },
  facebook: { bg: 'var(--primary)', text: '#fff', label: 'Facebook' },
  instagram: { bg: 'var(--primary)', text: '#fff', label: 'Instagram' },
  google: { bg: 'var(--primary)', text: '#fff', label: 'Google' },
  tiktok: { bg: 'var(--primary)', text: '#fff', label: 'TikTok' },
  linkedin: { bg: 'var(--primary)', text: '#fff', label: 'LinkedIn' },
  youtube: { bg: 'var(--primary)', text: '#fff', label: 'YouTube' },
};"""

content = content.replace(platform_colors_old, platform_colors_new)

# 2. Replace hardcoded instances of color in styles
# color: '#7B2FBE' -> color: RP
content = re.sub(r"color:\s*['\"]#7B2FBE['\"]", "color: RP", content)
# color: '#7B2FBE' inside JSX attribute -> color={RP}
content = re.sub(r"color=['\"]#7B2FBE['\"]", "color={RP}", content)
# bg='#f3e8ff' -> bg='var(--bg-surface)'
content = re.sub(r"bg=['\"]#f3e8ff['\"]", "bg='var(--bg-surface)'", content)
# background: '#7B2FBE' -> background: RP
content = re.sub(r"background:\s*['\"]#7B2FBE['\"]", "background: RP", content)
# background: '#f3e8ff' -> background: 'var(--bg-soft)'
content = re.sub(r"background:\s*['\"]#f3e8ff['\"]", "background: 'var(--bg-soft)'", content)
# border: '1px solid #d8b4fe' -> border: '1px solid var(--border)'
content = re.sub(r"border:\s*['\"]1px solid #d8b4fe['\"]", "border: '1px solid var(--border)'", content)

# 3. Replace border-left color borders: borderLeft: '3px solid #7B2FBE' -> borderLeft: `3px solid ${RP}`
content = re.sub(r"borderLeft:\s*['\"]3px solid #7B2FBE['\"]", "borderLeft: `3px solid ${RP}`", content)

# 4. Replace linear gradients in competitive gaps, etc.
content = re.sub(r"background:\s*['\"]linear-gradient\(135deg,#7B2FBE0?8,#5c8aff0?8\)['\"]", "background: 'var(--bg-soft)'", content)
content = re.sub(r"background:\s*['\"]linear-gradient\(135deg,#7B2FBE10,#5c8aff10\)['\"]", "background: 'var(--bg-soft)'", content)
content = re.sub(r"border:\s*['\"]1px solid #7B2FBE20['\"]", "border: '1px solid var(--border)'", content)

# 5. Fix single color instances
content = content.replace("color: '#7B2FBE'", "color: RP")
content = content.replace("background: '#7B2FBE'", "background: RP")

# 6. Map other hardcoded skill-meta colors (e.g. for Competitor, Creative, Landing etc) to RP
# Let's check skill meta block:
content = re.sub(r"color:\s*['\"]#(e8457a|f59e0b|4285F4|1877F2|00c9a7|64748b|5c8aff|8b5cf6|0077B5)['\"]", "color: RP", content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done processing SkillReport.tsx")
