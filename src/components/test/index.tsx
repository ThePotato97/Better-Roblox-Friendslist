import * as React from 'react';
import { Space, Card, Button, Input } from 'antd';

export class Test extends React.Component<any, any> {
  render() {
    return (
      <Space direction="vertical">
        <Card title="Card 1">
          <Space>
            <Button type="primary">ABC</Button>
            <Button>B</Button>
            <Button>C</Button>
          </Space>
        </Card>
        <Card title="Card 2">
          <Space>
            <Button type="primary">Button A</Button>
            <Button>Button B</Button>
            <Button>Button C</Button>
          </Space>
        </Card>
        <Card title="Card 3">
          <Input />
        </Card>
      </Space>
    );
  }
}
