import re

filepath = "/Users/nafadza/Documents/zieads/zieads-AI-Agent--main/src/pages/ReportDashboard.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the ambient glows and blurs
blur_elements = [
    r'<div className="absolute top-\[-20%\] left-\[-10%\] w-\[50%\] h-\[100%\] bg-indigo-600/20 rounded-full blur-\[120px\] mix-blend-screen"\s*/>',
    r'<div className="absolute bottom-\[-20%\] right-\[-10%\] w-\[50%\] h-\[100%\] bg-blue-600/20 rounded-full blur-\[120px\] mix-blend-screen"\s*/>',
    r'<div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-2xl"\s*/>',
    r'<div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-\[80px\]"\s*/>',
    r'<div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-\[100px\]"\s*/>',
    r'<div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/30 blur-\[100px\] rounded-full pointer-events-none"\s*/>',
    r'<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"\s*/>',
    r'<div className="absolute top-\[-20%\] left-\[-10%\] w-\[50%\] h-\[100%\] bg-indigo-600/20 rounded-full blur-\[120px\] mix-blend-screen"\s*/?>',
    r'<div className="absolute bottom-\[-20%\] right-\[-10%\] w-\[50%\] h-\[100%\] bg-blue-600/20 rounded-full blur-\[120px\] mix-blend-screen"\s*/?>',
    r'<div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-2xl"\s*/?>',
    r'<div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-\[80px\]"\s*/?>',
    r'<div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-\[100px\]"\s*/?>',
    r'<div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/30 blur-\[100px\] rounded-full pointer-events-none"\s*/?>'
]

for el in blur_elements:
    content = re.sub(el, '', content)

# Replace remaining gradients or custom colors
content = content.replace("bg-gradient-to-br from-indigo-500 to-blue-600", "bg-neutral-900")
content = content.replace("bg-gradient-to-br from-indigo-500/10 to-purple-500/10", "bg-neutral-100")
content = content.replace("shadow-indigo-600/20", "shadow-sm")

# Slate to neutral
content = content.replace("bg-slate-950", "bg-neutral-950")
content = content.replace("bg-slate-900", "bg-neutral-900")
content = content.replace("bg-slate-50/50", "bg-neutral-50/50")
content = content.replace("bg-slate-50", "bg-neutral-50")
content = content.replace("text-slate-400", "text-neutral-400")
content = content.replace("text-slate-700", "text-neutral-700")
content = content.replace("text-slate-900", "text-neutral-900")
content = content.replace("text-slate-500", "text-neutral-500")
content = content.replace("text-slate-600", "text-neutral-600")
content = content.replace("text-slate-200", "text-neutral-200")
content = content.replace("text-slate-300", "text-neutral-300")
content = content.replace("border-slate-100", "border-neutral-200")
content = content.replace("border-slate-200", "border-neutral-200")
content = content.replace("border-slate-800", "border-neutral-800")
content = content.replace("border-slate-50", "border-neutral-100")
content = content.replace("shadow-[0_8px_30px_rgb(0,0,0,0.04)]", "")
content = content.replace("shadow-[0_8px_30px_rgb(0,0,0,0.06)]", "")
content = content.replace("shadow-slate-900/10", "shadow-sm")

# Indigo classes replacements
content = content.replace("bg-indigo-600", "bg-neutral-950")
content = content.replace("bg-indigo-500/20", "bg-neutral-500/10")
content = content.replace("bg-indigo-500/30", "bg-neutral-500/10")
content = content.replace("text-indigo-600", "text-neutral-950")
content = content.replace("text-indigo-500", "text-neutral-600")
content = content.replace("text-indigo-400", "text-neutral-400")
content = content.replace("text-indigo-300", "text-neutral-300")
content = content.replace("hover:bg-indigo-600", "hover:bg-neutral-800")
content = content.replace("hover:text-indigo-700", "hover:text-neutral-950")
content = content.replace("hover:border-indigo-500", "hover:border-neutral-800")
content = content.replace("hover:shadow-indigo-500/25", "")
content = content.replace("bg-indigo-50", "bg-neutral-100")
content = content.replace("text-indigo-900", "text-neutral-900")
content = content.replace("selection:bg-indigo-100", "selection:bg-neutral-200")
content = content.replace("selection:text-indigo-900", "selection:text-neutral-900")
content = content.replace("focus:ring-indigo-500/20", "focus:ring-neutral-500/10")
content = content.replace("focus:border-indigo-500", "focus:border-neutral-950")
content = content.replace("border-indigo-500/30", "border-neutral-200")
content = content.replace("border-l-4 border-indigo-500", "border-l-4 border-neutral-950")
content = content.replace("bg-indigo-100", "bg-neutral-100")

# Radius tokens alignment to v3.0 standard (6px input/buttons, 8px cards, 12px max)
content = content.replace("rounded-[2.5rem]", "rounded-xl")
content = content.replace("rounded-[2rem]", "rounded-xl")
content = content.replace("rounded-[1.5rem]", "rounded-lg")
content = content.replace("rounded-[1rem]", "rounded-md")
content = content.replace("rounded-3xl", "rounded-xl")
content = content.replace("rounded-2xl", "rounded-lg")
content = content.replace("rounded-xl", "rounded-md")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done processing ReportDashboard.tsx")
