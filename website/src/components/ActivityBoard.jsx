import { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ActivityBoard({ userId }) {
  // Initialize with an empty year so the board shows INSTANTLY
  const [data, setData] = useState(() => {
    const emptyCalendar = [];
    for (let i = 365; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      emptyCalendar.push({
        date: `${year}-${month}-${day}`,
        count: 0,
        level: 0 
      });
    }
    return emptyCalendar;
  });

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        let stats = {};
        if (userSnap.exists()) {
          stats = userSnap.data().stats || {};
        }
        
        const calendarData = [];
        for (let i = 365; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i); 
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`; 
          
          const minutes = stats[dateStr] || 0; 
          
          let level = 0;
          if (minutes > 0) level = 1;
          if (minutes >= 45) level = 2;
          if (minutes >= 90) level = 3;
          if (minutes >= 120) level = 4;

          calendarData.push({
            date: dateStr,
            count: minutes,
            level: level 
          });
        }
        setData(calendarData);
      } catch (error) {
        console.error("Failed to fetch activity stats:", error);
      }
    }
    fetchStats();
  }, [userId]);


  return (
    <section style={{
       background: 'var(--surface)', 
       border: '1px solid var(--border)', 
       borderRadius: '16px', 
       padding: '24px',
       marginTop: '32px',
       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 1px 1px inset rgba(255, 255, 255, 0.03)',
       position: 'relative',
       overflow: 'hidden'
    }}>
       <h3 style={{ 
          fontSize: '24px', 
          fontWeight: '800',
          letterSpacing: '-0.5px',
          marginBottom: '24px', 
          background: 'linear-gradient(to right, #fff, #888)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
       }}>
         Deep Work Activity
       </h3>
       
       <div className="calendar-container">
         <ActivityCalendar 
           data={data} 
           theme={{
             dark: ['rgba(255, 255, 255, 0.03)', 'rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.6)', 'rgba(34, 197, 94, 0.8)', '#22c55e']
           }}
           colorScheme="dark"
           blockRadius={4}
           blockSize={12}
           blockMargin={4}
           labels={{
              totalCount: '{{count}} minutes locked in over the last year',
           }}
         />
       </div>

       {/* Hide the ugly default scrollbar but keep it scrollable */}
       <style>{`
         .calendar-container * {
           scrollbar-width: none !important; /* Firefox */
           -ms-overflow-style: none !important;  /* IE 10+ */
         }
         .calendar-container *::-webkit-scrollbar {
           display: none !important; /* Chrome/Safari/Webkit */
           width: 0 !important;
           height: 0 !important;
         }
       `}</style>
    </section>
  )
}
