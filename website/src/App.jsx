import TodoInput from "./components/Todoinput";
import TodoList from "./components/Todolist";
import { useState, useEffect } from "react";
import {auth, db, provider} from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, connectAuthEmulator } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';



function App() {

  const [todos, setTodos] = useState([])
  const[todoValue, setTodoValue] = useState("")
  const [user, setUser] = useState(null);


  useEffect(() =>  {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);


  const handleLogin = async () => {
    try{
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

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
      {user ? (
        <button onClick = {() => signOut(auth)}>Sign Out ({user.email}) 
      </button>
      ) : (
        <button onClick={handleLogin}> Sign In with Google </button>
      )}
      <div>
        <TodoInput todoValue = {todoValue} setTodoValue={setTodoValue} handleAddTodos={handleAddTodos} />
      </div>
      <TodoList handleEdit={handleEdit} todoValue = {todoValue} setTodoValue={setTodoValue} handleDelete = {handleDelete} todos={todos} />
    </main>
  )
}

export default App
