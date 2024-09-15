import { createSignal, type Component } from 'solid-js';

import './App.css';
import { Role } from './src/role/role';
import { As } from './src/as/as';
import { VisuallyHidden } from './src/visually-hidden/visually-hidden';

const App: Component = () => {
  const [dynamic, setDynamic] = createSignal(true);
  return (
    <div>
      <h1>LEGEND (color by tag)</h1>
      <p>p</p>
      <span>span</span>
      <button>button</button>
      <h1>EXAMPLES</h1>
      <h2>Tags</h2>
      <Role.span>span</Role.span>
      <Role.span render={<As.button />}>
        span (with children) + button
      </Role.span>
      <Role.span
        render={<As.button>span + button (with children)</As.button>}
      />
      <Role.span render={<As.button>i show up (children override)</As.button>}>
        i won't show up
      </Role.span>
      <Role.button>button</Role.button>
      <Role.button render={<As.span>button + span</As.span>} />
      <h2>Class</h2>
      <Role.button class="a" render={<As.button class="a" />}>
        (i should have ".a")
      </Role.button>
      <Role.button render={<As.button class="b" />}>
        (i should have ".b")
      </Role.button>
      <Role.button class="a" render={<As.button class="b" />}>
        (i should have ".a" and ".b")
      </Role.button>
      <h2>Reactive tag (click to toggle)</h2>
      <Role.button
        onClick={() => setDynamic((value) => !value)}
        render={
          dynamic() ? <As.span>button + span</As.span> : <As.p>button + p</As.p>
        }
      />
      <h2>Visually hidden (inspect)</h2>
      Here: <VisuallyHidden>Hello I'm hidden</VisuallyHidden>
    </div>
  );
};

export default App;
