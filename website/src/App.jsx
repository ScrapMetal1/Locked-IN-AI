import TodoInput from "./components/Todoinput"
import TodoList from "./components/Todolist"
import { useState, useEffect } from "react";



function App() {

  const [todos, setTodos] = useState([])
  const[todoValue, setTodoValue] = useState("")


  function handleAddTodos(newTodo) { 
    const newTodoList = [...todos, newTodo] //spread operator will populate the new array with exisiting
    setTodos(newTodoList)
    persistData(newTodoList)
  }

  function handleDelete(index){
    const newTodoList = todos.filter(( todo, todoIndex) => { //.filter js method --> creates a new array. 
      return todoIndex !== index
    })
    setTodos(newTodoList)
    persistData(newTodoList)
  }

  function handleEdit(index){
    const valueToBeEdited = todos[index]
    setTodoValue(valueToBeEdited)
    handleDelete(index)
  }

  useEffect(() => {
    if (!localStorage) {
      return
    }

    let localTodos = localStorage.getItem('todos')
    if (!localTodos){
      return
    }
    localTodos = JSON.parse(localTodos).todos
    setTodos(localTodos)
      
  }, [])

  function persistData(newList) {
    localStorage.setItem('todos', JSON.stringify({todos: newList}))
  }


  return (
    <main>
      <h1>Locked <span>IN</span></h1>
      <div>
        <TodoInput todoValue = {todoValue} setTodoValue={setTodoValue} handleAddTodos={handleAddTodos} />
      </div>
      <TodoList handleEdit={handleEdit} todoValue = {todoValue} setTodoValue={setTodoValue} handleDelete = {handleDelete} todos={todos} />
    </main>
  )
}

export default App
