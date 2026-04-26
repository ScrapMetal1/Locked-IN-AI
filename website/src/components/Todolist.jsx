import React from 'react'
import Todocard from './Todocard'

export default function Todolist(props) {
    
    const { todos } = props

    return (
        <ul>
            {todos.map((todo) => {
                return (
                    <Todocard {...props} key={todo.id} todoId={todo.id} todo={todo} />
                )
            })}
        </ul>
    )
}
