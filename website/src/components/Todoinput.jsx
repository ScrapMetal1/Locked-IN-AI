import { useState } from 'react';

export default function TodoInput(props) {

    const { todoValue, setTodoValue, handleAddTodos } = props


    return (
        <div>
            <input value={todoValue} onChange={(e) => {
                setTodoValue(e.target.value)
            }} placeholder="Enter Todo..." />
            <button onClick={() => {
                handleAddTodos(todoValue)
                setTodoValue("")
            }}>Add</button>
        </div>
    )
} 