import React from 'react'

export default function Todocard(props) {
    const { handleEdit, index, handleDelete, children } = props
    
    return (
        <li>
            <div>
                {children}
            </div>
            <div>
                <button onClick={() => {
                    handleEdit(index)
                }}>
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button onClick={() => {
                    handleDelete(index)
                }}>
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </li>
    )
}
