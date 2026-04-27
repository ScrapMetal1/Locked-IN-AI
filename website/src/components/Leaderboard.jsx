import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function Leaderboard() {
  const [filter, setFilter] = useState('weekly'); // 'daily', 'weekly', 'allTime'
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        const weekStr = sunday.toISOString().split("T")[0];

        // 1. Tell Firebase exactly which field to sort by
        let orderByField = "stats.allTime";
        if (filter === 'daily') orderByField = `stats.${todayStr}`;
        if (filter === 'weekly') orderByField = `stats.week_${weekStr}`;

        // 2. Query Firebase for the Top 50 Users
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy(orderByField, "desc"), limit(50)); //read request
        const snapshot = await getDocs(q);
        
        const fetchedLeaders = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let score = 0;
          if (data.stats) {
            if (filter === 'daily') score = data.stats[todayStr] || 0;
            if (filter === 'weekly') score = data.stats[`week_${weekStr}`] || 0;
            if (filter === 'allTime') score = data.stats.allTime || 0;
          }
          
          if (score > 0) {
            fetchedLeaders.push({
              id: doc.id,
              name: data.displayName || "Anonymous",
              photoURL: data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName}&background=random`,
              score: score
            });
          }
        });
        
        setLeaders(fetchedLeaders);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [filter]);

  return (
    <section style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '40px 20px',
      animation: 'slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
    }}>
      
      {/* ── Header & Filters ── */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px', height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15)'
        }}>
          <span style={{ fontSize: '28px' }}>🏆</span>
        </div>
        <h2 style={{ 
          color: '#fff', 
          fontSize: '36px', 
          fontWeight: '800',
          letterSpacing: '-1px',
          marginBottom: '24px', 
          background: 'linear-gradient(to right, #fff, #a0a0a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Global Leaderboard
        </h2>
        
        {/* Sleek Segmented Control */}
        <div style={{ 
          display: 'inline-flex', 
          background: 'rgba(255, 255, 255, 0.03)', 
          padding: '6px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          {['daily', 'weekly', 'allTime'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 24px',
                background: filter === f ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: filter === f ? '#22c55e' : '#888',
                border: `1px solid ${filter === f ? 'rgba(34, 197, 94, 0.3)' : 'transparent'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                textTransform: 'capitalize',
                boxShadow: filter === f ? '0 4px 12px rgba(34, 197, 94, 0.1)' : 'none'
              }}
              onMouseOver={(e) => {
                if(filter !== f) e.currentTarget.style.color = '#ccc';
              }}
              onMouseOut={(e) => {
                if(filter !== f) e.currentTarget.style.color = '#888';
              }}
            >
              {f === 'allTime' ? 'All Time' : f}
            </button>
          ))}
        </div>
      </header>

      {/* ── Leaderboard List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ 
              width: '40px', height: '40px', 
              border: '3px solid rgba(34, 197, 94, 0.2)',
              borderTopColor: '#22c55e',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#666', fontWeight: '500' }}>Loading the legends...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '60px 0', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '24px', border: '1px dashed rgba(255, 255, 255, 0.1)' 
          }}>
            <span style={{ fontSize: '40px', opacity: 0.5 }}>👻</span>
            <p style={{ color: '#888', marginTop: '16px', fontWeight: '500' }}>No focus time logged yet.</p>
          </div>
        ) : (
          leaders.map((user, index) => {
            const isTop3 = index < 3;
            const rankColors = ['#fbbf24', '#cbd5e1', '#b45309'];
            const rankColor = isTop3 ? rankColors[index] : '#444';
            
            return (
              <div 
                key={user.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  background: index === 0 ? 'linear-gradient(145deg, rgba(251, 191, 36, 0.1), rgba(20, 20, 20, 1))' : 'rgba(20, 20, 20, 0.8)',
                  border: `1px solid ${index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                  padding: '16px 24px', 
                  borderRadius: '20px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  boxShadow: index === 0 ? '0 10px 30px rgba(251, 191, 36, 0.05)' : '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                  e.currentTarget.style.boxShadow = index === 0 ? '0 20px 40px rgba(251, 191, 36, 0.1)' : '0 10px 30px rgba(0,0,0,0.4)';
                  e.currentTarget.style.borderColor = index === 0 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = index === 0 ? '0 10px 30px rgba(251, 191, 36, 0.05)' : '0 4px 20px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* Number Rank */}
                <div style={{ 
                  width: '32px', textAlign: 'center', fontWeight: '800', 
                  color: rankColor,
                  fontSize: isTop3 ? '24px' : '18px',
                  fontStyle: 'italic',
                  opacity: isTop3 ? 1 : 0.5
                }}>
                  {index + 1}
                </div>

                {/* Avatar with Glow for Top 3 */}
                <div style={{ position: 'relative' }}>
                  <img src={user.photoURL} alt={user.name} style={{ 
                    width: '52px', height: '52px', borderRadius: '50%', 
                    border: `2px solid ${isTop3 ? rankColor : 'transparent'}`,
                    padding: '2px', background: '#111'
                  }} />
                  {index === 0 && <span style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '20px' }}>👑</span>}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: index === 0 ? '#fbbf24' : '#fff', 
                    fontWeight: '700', 
                    fontSize: '18px',
                    letterSpacing: '-0.3px'
                  }}>
                    {user.name}
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '24px', letterSpacing: '-1px' }}>
                    {user.score}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Minutes
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Required for the loading spinner animation */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
