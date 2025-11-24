import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Target, Users, Search, FolderOpen, PieChart, ArrowLeft } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';


function Create() {
 const navigate = useNavigate();
 const location = useLocation();
 const colors = useThemeColors();
  // Determine if we're on a sub-route
 const isSubRoute = location.pathname !== '/create' && location.pathname.startsWith('/create');
 const [showCreateOptions, setShowCreateOptions] = useState(!isSubRoute);


 // Update state when route changes
 useEffect(() => {
   setShowCreateOptions(!isSubRoute);
 }, [isSubRoute]);


 const handleNavigatePersonalGoal = () => {
   setShowCreateOptions(false);
   navigate('personal-goal');
 };


 const handleNavigateCircle = () => {
   setShowCreateOptions(false);
   navigate('circle');
 };


 const handleBack = () => {
   setShowCreateOptions(true);
   navigate('/create');
 };


 // Show sub-route content
 if (!showCreateOptions) {
   return (
     <div style={{ backgroundColor: colors.background }}>
       <Outlet context={{ onBack: handleBack }} />
     </div>
   );
 }


 // Show Create Options
 return (
   <div className="pb-20 min-h-screen" style={{ backgroundColor: colors.background }}>
     {/* Navigation Bar */}
     <div className="border-b" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
       <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
         <button
           onClick={handleBack}
           className="p-2 rounded-lg hover:opacity-80 transition"
           style={{ backgroundColor: colors.background }}
         >
           <ArrowLeft size={20} style={{ color: colors.primary }} />
         </button>
         <h1 className="text-lg font-bold" style={{ color: colors.text }}>Create</h1>
         <div className="w-10" />
       </div>
     </div>


     <div className="max-w-4xl mx-auto px-4 py-6">
       <div className="mb-6">
         <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
           What would you like to create?
         </h1>
         <p className="text-sm" style={{ color: colors.textLight }}>
           Choose an option to start saving
         </p>
       </div>


       {/* Create Options Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
         {/* Create Personal Goal Option */}
         <button
           onClick={handleNavigatePersonalGoal}
           className="p-6 rounded-2xl border-2 transition-all hover:scale-105 text-left"
           style={{
             backgroundColor: colors.surface,
             borderColor: colors.border,
           }}
           onMouseEnter={(e) => {
             (e.currentTarget as HTMLElement).style.borderColor = colors.primary;
           }}
           onMouseLeave={(e) => {
             (e.currentTarget as HTMLElement).style.borderColor = colors.border;
           }}
         >
           <div className="flex flex-col items-center">
             <div
               className="p-4 rounded-2xl mb-4"
               style={{ backgroundColor: `${colors.primary}15` }}
             >
               <Target size={40} style={{ color: colors.primary }} />
             </div>
             <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
               Personal Goal
             </h3>
             <p className="text-center text-sm mb-4" style={{ color: colors.textLight }}>
               Set and track your individual savings targets
             </p>
             <div className="flex flex-wrap gap-2 justify-center">
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
               >
                 Solo Saving
               </span>
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
               >
                 Custom Timeline
               </span>
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
               >
                 Flexible Amount
               </span>
             </div>
           </div>
         </button>
         
         {/* Create Savings Circle Option */}
         <button
           onClick={handleNavigateCircle}
           className="p-6 rounded-2xl border-2 transition-all hover:scale-105 text-left"
           style={{
             backgroundColor: colors.surface,
             borderColor: colors.border,
           }}
           onMouseEnter={(e) => {
             (e.currentTarget as HTMLElement).style.borderColor = colors.secondary;
           }}
           onMouseLeave={(e) => {
             (e.currentTarget as HTMLElement).style.borderColor = colors.border;
           }}
         >
           <div className="flex flex-col items-center">
             <div
               className="p-4 rounded-2xl mb-4"
               style={{ backgroundColor: `${colors.secondary}15` }}
             >
               <Users size={40} style={{ color: colors.secondary }} />
             </div>
             <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
               Savings Circle
             </h3>
             <p className="text-center text-sm mb-4" style={{ color: colors.textLight }}>
               Create a group savings pool with friends
             </p>
             <div className="flex flex-wrap gap-2 justify-center">
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.warningBg, color: colors.secondary }}
               >
                 Group Saving
               </span>
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.warningBg, color: colors.secondary }}
               >
                 Shared Goals
               </span>
               <span
                 className="text-xs px-2 py-1 rounded-lg"
                 style={{ backgroundColor: colors.warningBg, color: colors.secondary }}
               >
                 Social Support
               </span>
             </div>
           </div>
         </button>
       </div>
      
       {/* Quick Actions */}
       <div>
         <h2 className="text-lg font-bold mb-4" style={{ color: colors.text }}>
           Quick Actions
         </h2>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <button
             onClick={() => navigate('/browse')}
             className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
             style={{ backgroundColor: colors.surface, borderColor: colors.border }}
           >
             <Search size={20} style={{ color: colors.primary }} />
             <div className="text-left">
               <div className="text-sm font-medium" style={{ color: colors.text }}>
                 Browse Circles
               </div>
               <div className="text-xs" style={{ color: colors.textLight }}>
                 Join existing groups
               </div>
             </div>
           </button>


           <button
             onClick={() => navigate('/goals')}
             className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
             style={{ backgroundColor: colors.surface, borderColor: colors.border }}
           >
             <FolderOpen size={20} style={{ color: colors.primary }} />
             <div className="text-left">
               <div className="text-sm font-medium" style={{ color: colors.text }}>
                 View Goals
               </div>
               <div className="text-xs" style={{ color: colors.textLight }}>
                 Track your progress
               </div>
             </div>
           </button>


           <button
             onClick={() => navigate('/analytics')}
             className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
             style={{ backgroundColor: colors.surface, borderColor: colors.border }}
           >
             <PieChart size={20} style={{ color: colors.primary }} />
             <div className="text-left">
               <div className="text-sm font-medium" style={{ color: colors.text }}>
                 Analytics
               </div>
               <div className="text-xs" style={{ color: colors.textLight }}>
                 View insights
               </div>
             </div>
           </button>
         </div>
       </div>
     </div>
   </div>
 );
}


export default Create;