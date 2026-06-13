import os
import glob

def apply_global_fixes():
    files = glob.glob('src/**/*.jsx', recursive=True)
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # We need to re-apply the global replacements from today's session
        # Rebrand "QRDine" to "RaShoyi"
        new_content = content.replace('QRDine', 'RaShoyi')
        
        # Replace logos
        # Old logo instances
        new_content = new_content.replace('/assets/RaShoyi_logo.png', '/RaShoyi_logo_circle.png')
        new_content = new_content.replace('/QRDine_logo.png', '/RaShoyi_logo_circle.png')
        new_content = new_content.replace('/assets/QRDine_logo.png', '/RaShoyi_logo_circle.png')
        
        # Also fix the OnboardingPage centering
        if "OnboardingPage.jsx" in f:
            # 1. Root wrapper
            target_1 = """      {/* MAIN CONTENT AREA */}
      <main className="max-w-[860px] my-6 sm:my-[40px] mx-auto px-4 sm:px-[24px]">
        {/* WIZARD CARD */}
        <div className="onboarding-card bg-[#FFFFFF] rounded-[20px] border border-[#EEEBE6] shadow-[0_4px_32px_rgba(0,0,0,0.06)] p-6 sm:p-[40px] mb-[32px]">"""
            replacement_1 = """      {/* MAIN CONTENT AREA */}
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-[40px_16px] md:p-[40px_24px] bg-[#F8F5F0]">
        {/* WIZARD CARD */}
        <div className="onboarding-card w-full max-w-[720px] mx-auto bg-[#FFFFFF] rounded-[20px] border border-[#EEEBE6] shadow-[0_4px_32px_rgba(0,0,0,0.06)] p-6 md:p-[40px]">"""
            new_content = new_content.replace(target_1, replacement_1)
            
            # 2. Heading Row
            target_2 = """              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-[28px]">
                <div>
                  <h2 className="font-syne font-[700] text-[26px] text-[#1C1C1C] tracking-[-0.02em] mb-[6px] flex flex-wrap items-center gap-2 m-0">
                    Your Menu
                    {menu.length > 0 && !menuLoading && (
                      <span className="text-[10px] bg-[#FFF0E6] text-[#F97316] px-2 py-1 rounded-full uppercase tracking-wider font-[600] m-0">Changes saved automatically</span>
                    )}
                  </h2>
                  <p className="font-inter text-[14px] text-[#888888] font-[400] m-0">
                    Add the dishes you serve. Customers will see these in real-time.
                  </p>
                </div>
                <button onClick={openAddModal} className="bg-[#F97316] text-white rounded-full px-[22px] py-[10px] font-inter font-[600] text-[14px] border-none shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:bg-[#EA580C] hover:-translate-y-[1px] transition-all min-h-[44px] flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>"""
            replacement_2 = """              <div className="flex justify-between items-center w-full gap-4 mb-[28px]">
                <div>
                  <h2 className="font-syne font-[700] text-[26px] text-[#1C1C1C] tracking-[-0.02em] mb-[6px] flex flex-wrap items-center gap-2 m-0">
                    Your Menu
                    {menu.length > 0 && !menuLoading && (
                      <span className="text-[10px] bg-[#FFF0E6] text-[#F97316] px-2 py-1 rounded-full uppercase tracking-wider font-[600] m-0">Changes saved automatically</span>
                    )}
                  </h2>
                  <p className="font-inter text-[14px] text-[#888888] font-[400] m-0">
                    Add the dishes you serve. Customers will see these in real-time.
                  </p>
                </div>
                <button onClick={openAddModal} className="bg-[#F97316] text-white rounded-full px-[22px] py-[10px] font-inter font-[600] text-[14px] border-none shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:bg-[#EA580C] hover:-translate-y-[1px] transition-all min-h-[44px] flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>"""
            new_content = new_content.replace(target_2, replacement_2)
            
            # 3. Empty State
            target_3 = """                <div className="border-2 border-dashed border-[#E8E3DC] rounded-[16px] bg-[#FAFAF8] py-[64px] px-[24px] text-center">
                  <div className="w-[72px] h-[72px] bg-[#F3F0EB] rounded-full mx-auto mb-[20px] flex items-center justify-center text-[#C4BAB0]">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-syne text-[20px] font-[700] text-[#1C1C1C] m-0 mb-[8px]">No dishes added yet</h3>
                  <p className="font-inter text-[14px] text-[#888888] max-w-[320px] mx-auto mt-0 mb-[28px] leading-[1.6]">
                    Add starters, mains, breads, drinks or desserts to build your digital menu.
                  </p>
                  <button onClick={openAddModal} className="bg-[#F97316] text-white rounded-full px-[22px] py-[10px] font-inter font-[600] text-[14px] border-none shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:bg-[#EA580C] hover:-translate-y-[1px] transition-all min-h-[44px] inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Your First Dish
                  </button>
                </div>"""
            replacement_3 = """                <div className="border-2 border-dashed border-[#E8E3DC] rounded-[16px] bg-[#FAFAF8] p-[48px_24px] text-center flex flex-col items-center justify-center w-full">
                  <div className="w-[72px] h-[72px] bg-[#F3F0EB] rounded-full mx-auto mb-[20px] flex items-center justify-center text-[#C4BAB0]" style={{ margin: '0 auto', display: 'flex' }}>
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-syne text-[20px] font-[700] text-[#1C1C1C] m-0 mb-[8px] text-center">No dishes added yet</h3>
                  <p className="font-inter text-[14px] text-[#888888] max-w-[320px] mx-auto mt-0 mb-[28px] leading-[1.6] text-center">
                    Add starters, mains, breads, drinks or desserts to build your digital menu.
                  </p>
                  <button onClick={openAddModal} className="bg-[#F97316] text-white rounded-full px-[22px] py-[10px] font-inter font-[600] text-[14px] border-none shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:bg-[#EA580C] hover:-translate-y-[1px] transition-all min-h-[44px] inline-flex items-center justify-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" /> Add Your First Dish
                  </button>
                </div>"""
            new_content = new_content.replace(target_3, replacement_3)

        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")

if __name__ == "__main__":
    apply_global_fixes()
    print("All fixes applied successfully.")
