import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Space, Card, Row } from 'antd';
import { observer } from 'mobx-react';

import { showImageInConsole } from '@/utils';

showImageInConsole('https://picsum.photos/200', 50);

@observer
class App extends React.Component {
  render() {
    return (
      <div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card title="Window Control">
            <Row>Window ID: {}</Row>
            <Row>
              <Button>Open X</Button>
            </Row>
          </Card>
        </Space>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
