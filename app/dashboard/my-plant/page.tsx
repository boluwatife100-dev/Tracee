import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Scissors, Wind, SprayCan, Droplet } from 'lucide-react'

const MyPlantPage = () => {
  return (
    <div className="max-w-6xl mx-auto w-full p-6 text-gray-800 font-sans ">
      <div className="mb-6">
        
        <h1 className="text-4xl font-bold text-[#0A3225]">Powdery Mildew Detected</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl overflow-hidden shadow-sm h-[320px] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_INgaerw43G_dq-L5PaGLCz37YPD8zjWY-WAmn69b_g&s" 
              alt="Monstera plant with powdery mildew" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-[#EBF2E5] rounded-xl p-6">
            <h3 className="font-semibold text-lg text-[#164332] mb-4">Scan Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="text-gray-500">Affected Plant</span>
                <span className="font-medium text-[#164332]">Monstera Deliciosa</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                <span className="text-gray-500">Scan Date</span>
                <span className="font-medium text-[#164332]">Oct 24, 2026 - 10:24 AM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Assigned Location</span>
                <span className="font-medium text-[#164332]">Living Room</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[#1F3D47] mb-3">What is this?</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              Powdery mildew is a common fungal disease that manifests as white or grayish powdery spots on the surfaces of leaves, stems, and fruits. It thrives in high humidity and moderate temperatures, spreading quickly if not treated promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1F3D47] mb-4">Key Symptoms Found</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item}>
                  <div className="flex items-center mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#164332] mr-2"></div>
                    <h4 className="font-semibold text-sm text-[#1F3D47]">White Powdery Coating</h4>
                  </div>
                  <p className="text-xs text-gray-400 ml-4">Covers upper leaf surfaces and restricts photosynthesis</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1F3D47] mb-4">Recommended Treatment Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col space-y-3 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#EBF2E5] text-[#164332] rounded-lg"><Scissors className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-[#1F3D47]">Prune Infected Leaves</h4>
                </div>
                <p className="text-xs text-gray-500">Carefully cut away heavily damaged stems and leaves with sanitized shears.</p>
              </div>

              <div className="border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col space-y-3 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#EBF2E5] text-[#164332] rounded-lg"><Wind className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-[#1F3D47]">Improve Airflow</h4>
                </div>
                <p className="text-xs text-gray-500">Move your Monstera to a spot with better air circulation to reduce local ambient humidity.</p>
              </div>

              <div className="border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col space-y-3 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#EBF2E5] text-[#164332] rounded-lg"><SprayCan className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-[#1F3D47]">Apply Neem Oil Spray</h4>
                </div>
                <p className="text-xs text-gray-500">Thoroughly coat both the tops and undersides of leaves during cool evening hours.</p>
              </div>

              <div className="border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col space-y-3 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#EBF2E5] text-[#164332] rounded-lg"><Droplet className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-[#1F3D47]">Adjust Water Schedule</h4>
                </div>
                <p className="text-xs text-gray-500">Water directly at soil level instead of wetting foliage, letting the top inch dry first.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 pb-12">
        <button className="w-full sm:w-[220px] px-8 py-3.5 rounded-xl border-2 border-[#164332] text-[#164332] font-semibold hover:bg-gray-50 transition-colors">
          Save to My plants
        </button>
        <button className="w-full sm:w-[220px] px-8 py-3.5 rounded-xl bg-[#0A3225] text-white font-semibold hover:bg-[#07241a] transition-colors">
          Start Care Routine
        </button>
      </div>
    </div>
  )
}

export default MyPlantPage
