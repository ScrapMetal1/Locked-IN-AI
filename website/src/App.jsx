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
    const fetchTodos = async () => {
      if (user) {
        // ─── LOGGED IN: Read from Firebase ───
        const userDocRef = doc(db, 'users', user.uid); //doc creates a pointer/address to the userid
        const docSnap = await getDoc(userDocRef); // gets a snapshot of the folder
        
        let dbTodos = [];
        if (docSnap.exists()) {
          dbTodos = docSnap.data().todos || []; //reads the data from the snapshot and grabs the todo strings
        }

        // Merge stray local storage items if they were using it in offline mode
        const localTodosStr = localStorage.getItem('todos');
        if (localTodosStr) {
          const localTodos = JSON.parse(localTodosStr).todos || [];
          
          localTodos.forEach(item => {
            if (!dbTodos.includes(item)) {
              dbTodos.push(item);
            }
          });
          
          // Clear local storage since they are now backed up
          localStorage.removeItem('todos');
          // Save the newly merged master list to Firebase
          await setDoc(userDocRef, { todos: dbTodos }, { merge: true });
        }
        
        setTodos(dbTodos); // render todos onto page
      } else {

        // ─── LOGGED OUT: Read from Local Storage ───
        const localTodosStr = localStorage.getItem('todos');
        if (localTodosStr) {
          setTodos(JSON.parse(localTodosStr).todos);
        } else {
          setTodos([]);
        }
      }
    };

    fetchTodos();
  }, [user]); // Re-run this entire effect automatically whenever user logs in or out

  async function persistData(newList) {
    if (user) {
      // Save to Cloud
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { todos: newList }, { merge: true });
    } else {
      // Save to Browser
      localStorage.setItem('todos', JSON.stringify({todos: newList}));
    }
  }


  return (
    <main>
      <h1>Locked <span>IN</span></h1>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '0 auto 24px auto', maxWidth: '350px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E1E1E', borderRadius: '8px', border: '1px solid #333', flex: 1 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
            <span style={{ color: '#aaa', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Time to Lock in {user.name}</span>
          </div>
          <button 
            onClick={() => signOut(auth)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto 24px auto',
            padding: '12px 24px',
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2A2A2A';
            e.currentTarget.style.borderColor = '#444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1E1E1E';
            e.currentTarget.style.borderColor = '#333';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      )}
      <div>
        <TodoInput todoValue = {todoValue} setTodoValue={setTodoValue} handleAddTodos={handleAddTodos} />
      </div>
      <TodoList handleEdit={handleEdit} todoValue = {todoValue} setTodoValue={setTodoValue} handleDelete = {handleDelete} todos={todos} />
    </main>
  )
}

export default App
