import React from 'react'
import Todocard from './Todocard'

export default function Todolist(props) {
    
    const {todos} = props //take the props from the parent class and take the property labelled todos and pull it out on its own standaloe variable.

    return (
        <ul className="todo-list">
            {todos.map((todo, todoIndex) => {
                return (
                    <Todocard key={todoIndex}>
                        <p>{todo}</p>
                    </Todocard>
                )
            })}
        </ul>
    )
}
