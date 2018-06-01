import React from "react";
import { handle_form_submit, process_form, get_input_value } from "convenable";

export class Editor extends React.Component {
  state = {
    validate: null,
    transform: null,
    processForm: null,
    values: null,
    originalValues: null
  };

  static getDerivedStateFromProps(props, state) {
    let newState = state;
    let changed = false;
    if (
      props.validate !== state.validate ||
      props.transform !== state.transform
    ) {
      newState = {
        ...newState,
        validate: props.validate,
        transform: props.transform,
        processForm: process_form(props)
      };
      changed = true;
    }
    if (props.values && props.values !== state.originalValues) {
      newState = {
        ...newState,
        values: props.values,
        originalValues: props.values
      };
      changed = true;
    }
    return changed ? newState : null;
  }

  onError = ({ errors }) => this.setState({ errors });

  onValidForm = serialized =>
    this.setState({ values: serialized.values, errors: {} }, () => {
      this.props.onSubmit && this.props.onSubmit(serialized);
    });

  onSubmit = handle_form_submit(serialized =>
    this.state
      .processForm(serialized)
      .then(
        validated =>
          validated.errors
            ? this.onError(validated)
            : this.onValidForm(validated)
      )
  );

  setValue = (name, value) =>
    this.setState({ values: { ...this.state.values, [name]: value } });

  onChange = cb => evt => {
    const input = evt.target;
    const value = get_input_value(input);
    if (typeof cb === "undefined") {
      console.log(input.value, value);
      this.setValue(input.name, value);
    } else if (typeof cb === "string") {
      this.setValue(cb, value);
    } else if (typeof cb === "function") {
      cb(value, this.setValue);
    }
  };

  resetField = name => {
    const value = this.state.originalValues[name];
    const values = { ...this.state.values, [name]: value };
    this.setState({ values });
  };

  reset = () => {
    const values = this.state.originalValues;
    this.setState({ values });
  };

  collectProps() {
    const { children: renderFunction, className, action } = this.props;
    const { errors, values } = this.state;
    const { onChange, resetField, reset, onSubmit } = this;
    const props = {
      renderFunction,
      errors,
      values,
      onChange,
      resetField,
      reset,
      onSubmit,
      className,
      action
    };
    return props;
  }

  render() {
    const props = this.collectProps();
    const { className, renderFunction, action } = props;
    if(typeof renderFunction !== 'function'){
      console.log('???',renderFunction)
      return false;
    }
    const content = renderFunction(props)
    return (
      <form
        className={className}
        action={action}
        onSubmit={this.onSubmit}
        onReset={this.reset}
      >
        {content}
      </form>
    );
  }
}
