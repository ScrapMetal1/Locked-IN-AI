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
  const [todoTime, setTodoTime] = useState(25);
  const [showCompleted, setShowCompleted] = useState(false);




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

  function handleDelete(id) {
    const newTodoList = todos.filter(todo => todo.id !== id)
    setTodos(newTodoList)
    persistData(newTodoList)
  }

  function handleEdit(id) {
    const todoToEdit = todos.find(todo => todo.id === id)
    if (todoToEdit) {
      setTodoValue(todoToEdit.title)
      handleDelete(id)
    }
  }

  function handleToggleComplete(id) {
    const newTodoList = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed }
      }
      return todo
    })
    setTodos(newTodoList)
    persistData(newTodoList)
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
    <div style={{ position: 'relative' }}>
      {/* ── Sign Out: Top Right Corner ── */}
      {user && (
        <button
          onClick={() => signOut(auth)}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#555',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font)',
            boxShadow: 'none',
            zIndex: 10,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#aaa';
            e.currentTarget.style.borderColor = '#444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#555';
            e.currentTarget.style.borderColor = '#2a2a2a';
          }}
        >
          Sign Out
        </button>
      )}

      <main>
        {/* ── Hero Title ── */}
        <h1 style={{ textShadow: '0 0 60px rgba(34, 197, 94, 0.15)' }}>
          Locked <span>IN</span>
        </h1>

        {/* ── Subtitle / Sign In ── */}
        {user ? (
          <p style={{
            textAlign: 'center',
            color: '#444',
            fontSize: '15px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            marginTop: '-16px',
            marginBottom: '8px',
          }}>
            Time to lock in, <span style={{ color: '#22c55e' }}>{user.displayName || 'User'}</span>
          </p>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: '380px',
              margin: '0 auto',
              padding: '14px 28px',
              backgroundColor: '#141414',
              color: '#ddd',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#141414';
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.color = '#ddd';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* ── Todo Input ── */}
        <div>
          <TodoInput todoTime={todoTime} setTodoTime={setTodoTime} todoValue={todoValue} setTodoValue={setTodoValue} handleAddTodos={handleAddTodos} />
        </div>

        {/* ── Todo List ── */}
        {/* ── Active Tasks ── */}
        <TodoList 
            handleEdit={handleEdit} 
            handleDelete={handleDelete} 
            handleToggleComplete={handleToggleComplete}
            todos={todos.filter(t => !t.completed)} 
        />

        {/* ── Completed Tasks (Collapsible) ── */}
        {todos.filter(t => t.completed).length > 0 && (
            <div style={{ marginTop: '8px' }}>
                {/* Divider with toggle */}
                <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '8px 0',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        color: '#444',
                        fontSize: '12px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font)',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#666'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#444'}
                >
                    {/* Left line */}
                    <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                    
                    {/* Chevron + Text */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <svg 
                            width="12" height="12" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ 
                                transition: 'transform 0.3s ease',
                                transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        Completed · {todos.filter(t => t.completed).length}
                    </span>
                    
                    {/* Right line */}
                    <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                </button>
                
                {/* Collapsible list */}
                <div style={{
                    maxHeight: showCompleted ? '1000px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease',
                    opacity: showCompleted ? 1 : 0,
                }}>
                    <TodoList 
                        handleEdit={handleEdit} 
                        handleDelete={handleDelete} 
                        handleToggleComplete={handleToggleComplete}
                        todos={todos.filter(t => t.completed)} 
                    />
                </div>
            </div>
        )}
      </main>
    </div>
  )
}

export default App
