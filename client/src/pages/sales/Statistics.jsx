import React, { useRef } from 'react';
import {
 AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
 CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { HiCalendarDays, HiArrowDownTray } from "react-icons/hi2";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";


// --- DATA ---
const sparkData = [{v:40}, {v:30}, {v:65}, {v:45}, {v:95}, {v:70}, {v:85}];


const overallData = [
 { name: 'Jan', last: 15000, current: 12000 },
 { name: 'Feb', last: 16000, current: 18000 },
 { name: 'Mar', last: 14000, current: 15000 },
 { name: 'Apr', last: 21000, current: 22000 },
 { name: 'May', last: 16000, current: 24843 },
 { name: 'Jun', last: 24000, current: 21000 },
 { name: 'Jul', last: 18000, current: 20000 },
 { name: 'Aug', last: 25000, current: 27000 },
 { name: 'Sep', last: 14000, current: 21000 },
 { name: 'Oct', last: 13000, current: 22000 },
 { name: 'Nov', last: 11000, current: 19000 },
 { name: 'Dec', last: 13000, current: 21000 },
];


const donutData = [
 { name: 'E-commerce', value: 67, color: '#333333' },
 { name: 'Marline website', value: 23, color: '#9ca3af' },
 { name: 'Offline store', value: 10, color: '#e5e7eb' },
];




const CustomPieTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
   return (
     <div className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-xl">
       <p>{`${payload[0].name}: ${payload[0].value}%`}</p>
     </div>
   );
 }
 return null;
};


// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, percentage, isUp, color, id }) => (
 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
   <div>
     <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
     <h3 className="text-xl font-black my-0.5" style={{ color: color }}>{value}</h3>
     <p className={`text-[11px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
       {isUp ? '↑' : '↓'} {percentage} <span className="text-gray-400 font-normal ml-0.5">vs last Month</span>
     </p>
   </div>
   <div className="h-10 w-full">
     <ResponsiveContainer width="100%" height="100%">
       <AreaChart data={sparkData}>
         <defs>
           <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
             <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
             <stop offset="100%" stopColor={color} stopOpacity={0}/>
           </linearGradient>
         </defs>
         <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} fill={`url(#grad-${id})`} isAnimationActive={false} />
       </AreaChart>
     </ResponsiveContainer>
   </div>
 </div>
);


// --- MAIN COMPONENT ---
const Statistics = () => {
 const statsRef = useRef();


 const handleExport = async () => {
   const element = statsRef.current;
   const canvas = await html2canvas(element, {
       scale: 3,
       useCORS: true,
       logging: false,
       backgroundColor: "#fcfcfc"
   });
   const imgData = canvas.toDataURL("image/png");
   const pdf = new jsPDF("p", "mm", "a4");
   const pdfWidth = pdf.internal.pageSize.getWidth();
   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
   pdf.save("inventory-stats.pdf");
 };


 return (
   <div className="p-6 bg-[#fcfcfc] min-h-screen font-sans" ref={statsRef}>
     {/* Header */}
     <div className="flex justify-between items-center mb-5">
       <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Transactions</h1>
       <button
           onClick={handleExport}
           className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
       >
         <HiArrowDownTray className="text-base" />
         <span>Export</span>
       </button>
     </div>


     {/* Top Cards Section */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
       <StatCard id="sales" title="Total Sales" value="$30,412" percentage="1.5 %" isUp={true} color="#22c55e" />
       <StatCard id="order" title="Total Order" value="12,980" percentage="0.7 %" isUp={false} color="#ef4444" />
       <StatCard id="cust" title="Total Customer" value="2.753" percentage="114 new" isUp={true} color="#22c55e" />
     </div>


     {/* Charts Middle Section */}
     <div className="grid grid-cols-12 gap-4 items-start mb-6">
      
       {/* Order Report Donut */}
       <div className="col-span-12 lg:col-span-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-[260px] flex flex-col">
         <div className="flex justify-between items-center mb-1">
           <h3 className="font-black text-base uppercase tracking-tight">Order Report</h3>
           {/* Single Icon Fixed Here */}
           <button className="flex items-center gap-1.5 text-[10px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-100">
             <HiCalendarDays className="text-sm" />
             <span className="font-black">Date</span>
           </button>
         </div>
         <div className="text-[#ef4444] font-black text-3xl tracking-tighter">190,567</div>
         <div className="text-[#ef4444] text-[10px] font-black mb-2 uppercase">↓ 0.2 % <span className="text-gray-300 font-normal ml-1">vs last Year</span></div>
        
         <div className="relative flex-1 flex items-center">
           <div className="w-3/5 h-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Tooltip content={<CustomPieTooltip />} />
                 <Pie
                   data={donutData}
                   innerRadius={38}
                   outerRadius={58}
                   startAngle={90}
                   endAngle={450}
                   dataKey="value"
                   stroke="none"
                   cursor="pointer"
                 >
                   {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-[50%] left-[30%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               <span className="text-sm font-black block text-gray-800 tracking-tighter">67%</span>
             </div>
           </div>
          
           <div className="w-2/5 space-y-2.5 pl-2">
             {donutData.map((item) => (
               <div key={item.name} className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{backgroundColor: item.color}} />
                 <span className="text-[10px] font-black text-gray-500 uppercase leading-tight">{item.name}</span>
               </div>
             ))}
           </div>
         </div>
       </div>


       {/* Overall Sales Dual Line */}
       <div className="col-span-12 lg:col-span-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-[260px]">
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-black text-base flex items-center gap-2 uppercase tracking-tight">
             Overall Sales <span className="text-green-500 text-[10px] font-black ml-2">↑ 1.1 % vs last Year</span>
           </h3>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Last Year
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-700 uppercase">
                <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" /> Running Year
              </div>
              {/* Single Icon Fixed Here Too */}
              <button className="flex items-center gap-1.5 text-[10px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 ml-1 hover:bg-gray-100">
                 <HiCalendarDays className="text-sm" />
                 <span className="font-black">Date</span>
              </button>
           </div>
         </div>


         <div className="h-40 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={overallData}>
               <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="0" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 800}} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 800}} tickFormatter={(v) => `${v/1000}K`} />
               <Tooltip />
               <Line type="monotone" dataKey="last" stroke="#22c55e" strokeWidth={2} dot={false} />
               <Line
                 type="monotone"
                 dataKey="current"
                 stroke="#1d4ed8"
                 strokeWidth={3}
                 dot={(props) => {
                   const {cx, cy, payload} = props;
                   if (payload.name === 'May') {
                     return (
                       <g key="highlight">
                         <circle cx={cx} cy={cy} r={5} fill="black" stroke="white" strokeWidth={2}/>
                         <text x={cx + 8} y={cy - 8} fontSize="10" fontWeight="900" fill="black">$24,843</text>
                       </g>
                     );
                   }
                   return null;
                 }}
               />
             </LineChart>
           </ResponsiveContainer>
         </div>
       </div>
     </div>


     {/* Orders Table Area */}
     <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[300px]">
       <h3 className="font-black text-lg mb-4 uppercase tracking-tight">Recent Orders</h3>
       <div className="flex items-center justify-center h-40 text-gray-200 border-2 border-dashed border-gray-100 rounded-lg font-black text-2xl uppercase">
         Ready for table
       </div>
     </div>
   </div>
 );
};


export default Statistics;

