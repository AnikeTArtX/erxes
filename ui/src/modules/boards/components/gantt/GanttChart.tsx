import React from 'react';
import TimeLine from 'react-gantt-timeline';
import {
  GanttContainer,
  NavContainer,
  ModeTitle,
  ModeContainer,
  TimelineContainer
} from 'modules/boards/styles/viewtype';
import { withRouter } from 'react-router-dom';
import Button from 'modules/common/components/Button';
import { IOptions, IItem } from 'modules/boards/types';
import { IRouterProps } from 'modules/common/types';
import { __ } from 'modules/common/utils';
import { genID, config } from './utils';

type Props = {
  length: number;
  items: IItem[];
  options: IOptions;
  refetch: () => void;
  groupType: string;
  save: (items: any[], links: any[]) => void;
} & IRouterProps;

type State = {
  data: any[];
  selectedItem: any;
  timelineMode: string;
  links: any[];
};

class GanttChart extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const data: Array<any> = [];
    let links: Array<any> = [];

    props.items.forEach(item => {
      if (item.startDate && item.closeDate) {
        data.push({
          id: item._id,
          start: new Date(item.startDate),
          end: new Date(item.closeDate),
          name: item.name,
          color: '#5629B6'
        });

        if (item.relations) {
          links = links.concat(item.relations);
        }
      }
    });

    this.state = {
      data,
      selectedItem: null,
      timelineMode: 'month',
      links
    };
  }

  onHorizonChange = (start, end) => {
    let result = this.state.data.filter(item => {
      return (
        (item.start < start && item.end > end) ||
        (item.start > start && item.start < end) ||
        (item.end > start && item.end < end)
      );
    });
    this.setState({ data: result });
  };

  onSelectItem = item => {
    this.setState({ selectedItem: item });
  };

  onUpdateTask = (item, props) => {
    item.start = props.start;
    item.end = props.end;
    this.setState({ data: [...this.state.data] });
  };

  createLink(start, end) {
    return {
      id: genID(),
      start: start.task.id,
      startPosition: start.position,
      end: end.task.id,
      endPosition: end.position
    };
  }

  onCreateLink = item => {
    let newLink = this.createLink(item.start, item.end);

    this.setState({ links: [...this.state.links, newLink] });
  };

  getbuttonStyle(value) {
    return this.state.timelineMode === value
      ? { backgroundColor: 'grey', boder: 'solid 1px #223344' }
      : {};
  }

  modeChange = value => {
    this.setState({ timelineMode: value });
  };

  getRandomDate() {
    let result = new Date();
    result.setDate(result.getDate() + Math.random() * 10);
    return result;
  }

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';

    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }

  delete = () => {
    if (this.state.selectedItem) {
      const index = this.state.links.indexOf(this.state.selectedItem);

      if (index > -1) {
        this.state.links.splice(index, 1);

        this.setState({ links: [...this.state.links] });
      }
    }
  };

  save = () => {
    const { data, links } = this.state;

    const items: Array<any> = [];

    for (const item of data) {
      items.push({
        _id: item.id,
        startDate: item.start,
        closeDate: item.end
      });
    }

    this.props.save(items, links);
  };

  render() {
    return (
      <GanttContainer>
        <NavContainer>
          <ModeTitle>Gantt Timeline</ModeTitle>
          <ModeContainer>
            <Button
              btnStyle="simple"
              size="small"
              onClick={() => this.modeChange('day')}
            >
              {__('Day')}
            </Button>
            <Button
              btnStyle="simple"
              size="small"
              onClick={() => this.modeChange('week')}
            >
              {__('Week')}
            </Button>
            <Button
              btnStyle="simple"
              size="small"
              onClick={() => this.modeChange('month')}
            >
              {__('Month')}
            </Button>
            <Button
              btnStyle="simple"
              size="small"
              onClick={() => this.modeChange('year')}
            >
              {__('Year')}
            </Button>
            <Button btnStyle="danger" onClick={this.delete}>
              {__('Delete')}
            </Button>
            <Button btnStyle="success" onClick={this.save}>
              {__('Save')}
            </Button>
          </ModeContainer>
        </NavContainer>
        <TimelineContainer>
          <TimeLine
            config={config}
            data={this.state.data}
            links={this.state.links}
            onHorizonChange={this.onHorizonChange}
            onSelectItem={this.onSelectItem}
            onUpdateTask={this.onUpdateTask}
            onCreateLink={this.onCreateLink}
            mode={this.state.timelineMode}
            itemheight={40}
            selectedItem={this.state.selectedItem}
            nonEditableName={true}
          />
        </TimelineContainer>
      </GanttContainer>
    );
  }
}

export default withRouter(GanttChart);
