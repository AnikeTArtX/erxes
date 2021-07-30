import { __, Alert } from 'modules/common/utils';
import { jsPlumb } from 'jsplumb';
import jquery from 'jquery';
import Wrapper from 'modules/layout/components/Wrapper';
import React from 'react';

import { IAction, IAutomation, ITrigger } from '../../types';
import { Container } from '../../styles';
import Form from 'modules/common/components/form/Form';
import { IFormProps } from 'modules/common/types';
import {
  ControlLabel,
  FormControl,
  FormGroup
} from 'modules/common/components/form';
import { FormColumn, FormWrapper } from 'modules/common/styles/main';
import { BarItems } from 'modules/layout/styles';
import Button from 'modules/common/components/Button';
import ModalTrigger from 'modules/common/components/ModalTrigger';
import TriggerForm from '../../containers/forms/TriggerForm';
import ActionsForm from '../../containers/forms/ActionsForm';
import TriggerDetailForm from '../../containers/forms/TriggerDetailForm';
import Modal from 'react-bootstrap/Modal';
import {
  createInitialConnections,
  connection
} from 'modules/automations/utils';
import ActionDetailForm from '../../containers/forms/ActionDetailForm';

const plumb: any = jsPlumb;
let instance;

type Props = {
  id?: string;
  automation?: IAutomation;
  save: (params: any) => void;
};

type State = {
  name: string;
  status: string;
  showModal: boolean;
  showActionModal: boolean;
  actions: IAction[];
  triggers: ITrigger[];
  selectedContentId?: string;
  currentAction?: {
    trigger: ITrigger;
    action: IAction;
  };
};

class AutomationForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const {
      automation = {
        name: 'Unknown automation',
        status: 'draft',
        triggers: [],
        actions: []
      }
    } = this.props;

    this.state = {
      name: automation.name,
      status: automation.status,
      actions: automation.actions || [],
      triggers: automation.triggers || [],
      showModal: false,
      showActionModal: false
    };
  }

  onClick = (trigger?: ITrigger) => {
    if (!trigger) {
      return;
    }

    const config = trigger && trigger.config;
    const selectedContentId = config && config.contentId;

    this.setState({
      showModal: !this.state.showModal,
      selectedContentId
    });
  };

  onClickAction = (action?: IAction) => {
    if (!action) {
      return;
    }

    const { triggers = [] } = this.state;
    const relatedTrigger = triggers.find(e => e.actionId === action.id);

    if (relatedTrigger) {
      this.setState({
        showActionModal: !this.state.showModal,
        currentAction: { trigger: relatedTrigger, action }
      });
    }
  };

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { name, status, triggers, actions } = this.state;
    const { id, save } = this.props;

    if (!name) {
      return Alert.error('Enter an Automation name');
    }

    const generateValues = () => {
      const finalValues = {
        _id: id,
        name,
        status,
        triggers: triggers.map(t => ({
          id: t.id,
          type: t.type,
          actionId: t.actionId,
          config: t.config,
          style: jquery(`#trigger-${t.id}`).attr('style')
        })),
        actions: actions.map(a => ({
          id: a.id,
          type: a.type,
          nextActionId: a.nextActionId,
          config: a.config,
          style: jquery(`#action-${a.id}`).attr('style')
        }))
      };

      return finalValues;
    };

    save(generateValues());
  };

  renderTrigger = (trigger: ITrigger) => {
    const idElm = `trigger-${trigger.id}`;

    jquery('#canvas').append(`
      <div class="trigger" id="${idElm}" style="${trigger.style}">
        ${trigger.type}
      </div>
    `);

    jquery('#canvas').on('click', `#${idElm}`, event => {
      event.preventDefault();

      this.onClick(trigger);
    });

    instance.addEndpoint(idElm, {
      anchor: [1, 0.5],
      isSource: true
    });

    instance.draggable(instance.getSelector(`#${idElm}`));
  };

  renderAction = (action: IAction) => {
    const idElm = `action-${action.id}`;

    jquery('#canvas').append(`
          <div class="action" id="${idElm}" style="${action.style}" type="${action.type}">
            ${action.type}
          </div>
        `);

    jquery('#canvas').on('click', `#${idElm}`, event => {
      event.preventDefault();

      this.onClickAction(action);
    });

    if (action.type === 'if') {
      instance.addEndpoint(idElm, {
        anchor: ['Left'],
        isTarget: true
      });

      instance.addEndpoint(idElm, {
        anchor: [1, 0.2],
        isSource: true,
        overlays: [
          [
            'Label',
            {
              location: [1.8, 0.5],
              label: 'Yes',
              visible: true
            }
          ]
        ]
      });

      instance.addEndpoint(idElm, {
        anchor: [1, 0.8],
        isSource: true,
        overlays: [
          [
            'Label',
            {
              location: [1.8, 0.5],
              label: 'No',
              visible: true
            }
          ]
        ]
      });
    } else {
      instance.addEndpoint(idElm, {
        anchor: ['Left'],
        isTarget: true
      });

      instance.addEndpoint(idElm, {
        anchor: ['Right'],
        isSource: true
      });
    }

    instance.draggable(instance.getSelector(`#${idElm}`));
  };

  onConnection = info => {
    const { triggers, actions } = this.state;

    connection(triggers, actions, info, info.targetId.replace('action-', ''));

    this.setState({ triggers, actions });
  };

  onDettachConnection = info => {
    const { triggers, actions } = this.state;

    connection(triggers, actions, info, undefined);

    this.setState({ triggers, actions });
  };

  componentDidMount() {
    instance = plumb.getInstance({
      DragOptions: { cursor: 'pointer', zIndex: 2000 },
      PaintStyle: {
        gradient: {
          stops: [
            [0, '#0d78bc'],
            [1, '#558822']
          ]
        },
        stroke: '#558822',
        strokeWidth: 3
      },
      Container: 'canvas'
    });

    instance.bind('ready', () => {
      const { triggers, actions } = this.state;

      instance.bind('connection', info => {
        this.onConnection(info);
      });

      instance.bind('connectionDetached', info => {
        this.onDettachConnection(info);
      });

      for (const action of actions) {
        this.renderAction(action);
      }

      for (const trigger of triggers) {
        this.renderTrigger(trigger);
      }

      // create connections ===================
      createInitialConnections(triggers, actions, instance);

      instance.bind('contextmenu', (component, event) => {
        if (component.hasClass('jtk-connector')) {
          console.log('heree cnnecct', event.pageY, event.pageX);
          event.preventDefault();
          // instance.getSelector(`#${idElm}`).selectedConnection = component;
          jquery(
            "<div class='custom-menu'><button class='delete-connection'>Delete connection</button></div>"
          )
            .appendTo('#canvas')
            .css({ top: event.pageY + 'px', left: event.pageX + 'px' });
        }
      });

      jquery('#canvas').on('click', '.delete-connection', event => {
        instance
          .deleteConnection
          // instance.getSelector(`#${idElm}`).selectedConnection
          ();
      });
    });
  }

  addTrigger = (value: string, contentId?: string) => {
    const { triggers } = this.state;
    const trigger: any = { id: String(triggers.length), type: value };

    if (contentId) {
      trigger.config = {
        contentId
      };
    }

    triggers.push(trigger);
    this.setState({ triggers });

    this.renderTrigger(trigger);
  };

  addAction = (value: string) => {
    const { actions } = this.state;
    const action = { id: String(actions.length), type: value };

    actions.push(action);
    this.setState({ actions });

    this.renderAction(action);
  };

  onNameChange = (e: React.FormEvent<HTMLElement>) => {
    const value = (e.currentTarget as HTMLButtonElement).value;
    this.setState({ name: value });
  };

  formContent = (formProps: IFormProps) => {
    const { name } = this.state;
    // const { id } = this.props;
    // const { isSubmitted } = formProps;

    // const generateValues = () => {
    //   const finalValues = {
    //     _id: id,
    //     name,
    //     status,
    //     triggers: triggers.map((t) => ({
    //       id: t.id,
    //       type: t.type,
    //       actionId: t.actionId,
    //       config: t.config,
    //       style: jquery(`#trigger-${t.id}`).attr("style"),
    //     })),
    //     actions: actions.map((a) => ({
    //       id: a.id,
    //       type: a.type,
    //       nextActionId: a.nextActionId,
    //       config: a.config,
    //       style: jquery(`#action-${a.id}`).attr("style"),
    //     })),
    //   };

    //   return finalValues;
    // };

    return (
      <Container>
        <FormWrapper>
          <FormColumn>
            <FormGroup>
              <ControlLabel required={true}>Name</ControlLabel>
              <FormControl
                {...formProps}
                name="name"
                value={name}
                onChange={this.onNameChange}
                required={true}
                autoFocus={true}
              />
            </FormGroup>
          </FormColumn>
          <FormColumn>
            {/* {renderButton({
              name: "save",
              values: generateValues(),
              isSubmitted,
            })} */}
          </FormColumn>
        </FormWrapper>

        <div id="canvas" />
      </Container>
    );
  };

  renderContent = () => {
    return <Form renderContent={this.formContent} />;
  };

  renderActionForm() {
    const trigger = (
      <Button btnStyle="primary" size="small" icon="plus-circle">
        Add New Action
      </Button>
    );

    const content = props => (
      <ActionsForm addAction={this.addAction} {...props} />
    );

    return (
      <div>
        <ModalTrigger
          title="Add a New Action"
          trigger={trigger}
          content={content}
        />
      </div>
    );
  }

  renderTriggerForm() {
    const trigger = (
      <Button btnStyle="primary" size="small" icon="plus-circle">
        Add New Trigger
      </Button>
    );

    const content = props => (
      <TriggerForm addTrigger={this.addTrigger} {...props} />
    );

    return (
      <div>
        <ModalTrigger
          title="Select a Trigger"
          trigger={trigger}
          content={content}
        />
      </div>
    );
  }

  renderManageForm() {
    if (!this.state.showModal) {
      return null;
    }

    return (
      <Modal show={true} onHide={this.onClick}>
        <Modal.Header closeButton={true}>
          <Modal.Title>Edit</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <TriggerDetailForm
            activeTrigger=""
            addTrigger={this.addTrigger}
            closeModal={this.onClick}
            contentId={this.state.selectedContentId}
          />
        </Modal.Body>
      </Modal>
    );
  }

  renderManageAction() {
    if (!this.state.showActionModal) {
      return null;
    }

    const { currentAction } = this.state;

    if (!currentAction) {
      return;
    }

    return (
      <Modal show={true} onHide={this.onClick}>
        <Modal.Header closeButton={true}>
          <Modal.Title>Edit action</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ActionDetailForm
            trigger={currentAction.trigger}
            action={currentAction.action}
            closeModal={this.onClick}
          />
        </Modal.Body>
      </Modal>
    );
  }

  rendeRightActionbar() {
    return (
      <BarItems>
        {this.renderTriggerForm()}
        {this.renderActionForm()}
        <Button
          btnStyle="success"
          size="small"
          icon={'check-circle'}
          onClick={this.handleSubmit}
        >
          Save
        </Button>
      </BarItems>
    );
  }

  render() {
    const { automation } = this.props;

    return (
      <React.Fragment>
        <Wrapper
          header={
            <Wrapper.Header
              title={`${'Automations' || ''}`}
              breadcrumb={[
                { title: __('Automations'), link: '/automations' },
                { title: `${(automation && automation.name) || ''}` }
              ]}
            />
          }
          actionBar={<Wrapper.ActionBar right={this.rendeRightActionbar()} />}
          content={this.renderContent()}
        />
        {this.renderManageForm()}
        {this.renderManageAction()}
      </React.Fragment>
    );
  }
}

export default AutomationForm;
