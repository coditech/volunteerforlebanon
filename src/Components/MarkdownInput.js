import React from "react";
import { renderMarkdown } from "../utils";
import { Pane } from "./Pane";

const style = { height: "100%" };

export class MarkdownInput extends React.Component {
  state = {
    html: "",
    previousValue: ""
  };
  static getDerivedStateFromProps(props, state) {
    const { value: v, defaultValue: v2 } = props;
    const value = v || v2;
    if (value && value !== state.previousValue) {
      const html = renderMarkdown(value);
      return { html, previousValue: value };
    }
    return null;
  }
  onChange = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    const { value } = evt.target;
    const html = renderMarkdown(value);
    this.setState({ html });
    this.props.onChange && this.props.onChange(evt);
  };
  render() {
    const { onChange } = this;
    const props = { style, ...this.props, onChange };
    return (
      <div className="flex two">
        <div>
          <textarea {...props} />
        </div>
        <div>
          <Pane value={this.state.html} />
        </div>
      </div>
    );
  }
}
