import { createEffect, createSignal, type Component } from 'solid-js';

import './App.css';
import { Role } from './src/role/role';
import { As } from './src/as/as';
import { VisuallyHidden } from './src/visually-hidden/visually-hidden';
import { FocusTrap, useFocusTrap } from './src/focus-trap/focus-trap';
import { HeadingLevel } from './src/heading/heading-level';
import { Heading } from './src/heading/heading';
import { Group } from './src/group/group';
import { GroupLabel } from './src/group/group-label';
import { Separator } from './src/separator/separator';

const App: Component = () => {
  const [dynamic, setDynamic] = createSignal(true);
  let focusTargetRef!: HTMLButtonElement
  let focusTarget2Ref!: HTMLButtonElement
  let headingRef!: HTMLDivElement
  createEffect(() => {
    console.log({headingRef})
  })
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
      <h2>Focus trap (tab into it)</h2>
      <FocusTrap onFocus={() => focusTargetRef.focus()}>hidden</FocusTrap>
      <button>decoy button</button>
      <button ref={focusTargetRef!}>focus target!</button>
      <h2>Focus trap but using hook</h2>
      <Role.span {...useFocusTrap({onFocus: () => focusTarget2Ref.focus()})} />
      <button>decoy button</button>
      <button ref={focusTarget2Ref!}>focus target!</button>
      <h2>Headings</h2>
      <HeadingLevel>
        <Heading ref={headingRef as HTMLHeadingElement} render={<As.div />} >H1?</Heading>
        <HeadingLevel>
          <Heading class="a" data-test='outer' onClick={() => console.log("outer")} render={<As.div class="b" data-test='inner' onClick={() => console.log("inner")} />}>H2?</Heading>
        <HeadingLevel>
          <Heading>H3?</Heading>
        </HeadingLevel>
        </HeadingLevel>
      </HeadingLevel>
      <h2>Group</h2>
      <Group>
        <GroupLabel>Label</GroupLabel>
      </Group>
      <Group>
        <GroupLabel id="my-id">Label with id</GroupLabel>
      </Group>
      <h2>Separator</h2>
      <Separator />
      <Separator orientation='vertical' />
    </div>
  );
};

export default App;
