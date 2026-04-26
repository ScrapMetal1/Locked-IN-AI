import { useState } from 'react';

export default function TodoInput(props) {

    const { todoValue, setTodoValue, handleAddTodos, todoTime, setTodoTime } = props


    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#1E1E1E', 
            padding: '8px 12px', 
            borderRadius: '12px', 
            border: '1px solid #333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            marginBottom: '24px'
        }}>

        {/* Main Text Input for the task */}
                    
        <input 
            value={todoValue} 
            onChange={(e) => setTodoValue(e.target.value)} 
            placeholder="What is important user?" 
            style={{ 
                flex: 1, 
                backgroundColor: 'transparent', 
                border: 'none', 
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                padding: '8px'
            }} 
        />

        {/* Time INput */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2A2A2A',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #444',
            marginRight: '8px',
        }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {/* Invisible Number Input */}
                <input 
                    type="number"
                    value={todoTime}
                    onChange={(e) => setTodoTime(Number(e.target.value))}
                    style={{
                        width: '50px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#22c55e',
                        fontSize: '14px',
                        fontWeight: '700',
                        textAlign: 'right',
                        outline: 'none',
                        padding: 0
                    }}
                />
                <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '500' }}>m</span>
            </div>
            <button 
                onClick={() => {
                    if (!todoValue.trim()) return; // Don't allow empty tasks
                    handleAddTodos({ title: todoValue, duration: todoTime });
                    setTodoValue("");
                }}
                style={{
                    backgroundColor: '#22c55e',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
            >
                Add
            </button>
        </div>
    )
}
        

            

