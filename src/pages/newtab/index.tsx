import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Test } from '@/components/test';
import reactGif from '@/images/react.gif';

const App: React.FC = () => (
  <>
    <p>
      <img src={reactGif} />
    </p>
    <p>
      <span>If you are seeing this page, the newtab is compiled successfully and working correctly.</span>
    </p>
    <Test />
  </>
);

ReactDOM.render(<App />, document.getElementById('root'));
