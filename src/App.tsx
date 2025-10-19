import { ConnectButton } from "thirdweb/react"
import { client } from "./thirdwebClient"

function App() {

  return (
    <main>
      <div className='flex justify-center items-center'>
        <h2 className="text-green-600">Hello CirclePot</h2>
        <ConnectButton client={client} />
      </div>
    </main>
  )
}

export default App
