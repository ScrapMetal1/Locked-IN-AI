import React from 'react'

export default function Todocard(props) {
    const { children } = props
    return (
        <li className='todo-item'>
            {children}
            <div className="actionsContainer">
                <i className="fa-solid fa-pen-to-square" style={{ color: 'rgb(28, 150, 22)' }}></i>
                <i className="fa-solid fa-trash" style={{ color: 'rgb(28, 150, 22)' }}></i>
            </div>
        </li>
    )
}
