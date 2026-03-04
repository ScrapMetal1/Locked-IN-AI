import React from 'react'
import Todocard from './Todocard'

export default function Todolist(props) {
    
    const {todos} = props //take the props from the parent class and take the property labelled todos and pull it out on its own standaloe variable.

    return (
        <ul>
            {todos.map((todo, todoIndex) => { //js function to loop through an array. 
                return (
                    <Todocard {...props} key={todoIndex} index={todoIndex}> 
                        <p>{todo}</p>
                    </Todocard>
                )
            })}
        </ul>
    )
}
