import TodoInput from "./components/Todoinput"
import TodoList from "./components/Todolist"

function App() {
  let todos = [
    'Go to the gym',
    'Finish the todo',
    'post devlog to flavortown'
  ]
  return (
    <main>
      <>
        <TodoInput />
        <TodoList todos={todos} />
      </>
    </main>
  )
}

export default App
