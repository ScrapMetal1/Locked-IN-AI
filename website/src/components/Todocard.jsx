import React, { useState } from 'react'

export default function Todocard(props) {
    const { handleToggleComplete, handleEdit, todoId, handleDelete, todo } = props
    const [animating, setAnimating] = useState(false)

    const handleComplete = () => {
        setAnimating(true)
        setTimeout(() => {
            handleToggleComplete(todoId)
            setAnimating(false)
        }, 300)
    }
    
    return (
        <li 
            className={animating ? 'completing' : ''} 
            style={{ opacity: todo.completed ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
        >
            {/* Left side: Checkbox + Title + Duration Badge */}
            <div>
                {/* Completion Toggle */}
                <button onClick={handleComplete} style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: (animating || todo.completed) ? '#22c55e' : '#555',
                    transition: 'color 0.2s ease',
                    boxShadow: 'none',
                }}>
                    <i className={(animating || todo.completed) ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}></i>
                </button>

                {/* Task Title */}
                <span 
                    className={`todo-title ${(animating || todo.completed) ? 'struck' : ''}`}
                    style={{
                        color: todo.completed ? '#555' : '#f0f0f0',
                        transition: 'color 0.3s ease',
                    }}
                >
                    {todo.title}
                </span>

                {/* Duration Badge */}
                <span style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    marginLeft: '8px',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                }}>
                    {todo.duration}m
                </span>
            </div>

            {/* Right side: Edit + Delete */}
            <div>
                <button onClick={() => handleEdit(todoId)}>
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button onClick={() => handleDelete(todoId)}>
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </li>
    )
}
