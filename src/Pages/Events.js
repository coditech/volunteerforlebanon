import React from "react";
import {
  isEditMode,
  renderMarkdown,
  slugify,
  uploadFileWithToaster,
  deleteFileWithToaster,
  toast,
  read_image_from_file
} from "../utils";
import {
  Img,
  Page,
  Content,
  Pane,
  Link,
  Loading,
  Title,
  Editor,
  FormControl as Input,
  FirebaseProvider
} from "../Components";

const formatDate = (date) => date.replace(/-/g,'/')

const processSubmit = process => form => {
  console.log(form);
  uploadFileWithToaster("/articles", form.values.image)
    .then(
      image =>
        image
          ? process(form.action, { ...form.values, image })
          : process(form.action, form.values)
    )
    .then(() =>
      toast(`✓ article posted`, { type: toast.TYPE.INFO, autoClose: 3000 })
    );
};

const processRemove = process => form => {
  return deleteFileWithToaster(form.values.image)
    .then(() => process("delete", { id: form.values.id }))
    .then(() =>
      toast(`✓ article deleted`, { type: toast.TYPE.INFO, autoClose: 3000 })
    );
};

const validate = (form, errors) => {
  if (!form.values.title) {
    errors.title = "title is mandatory";
  }
};

const transform = form => {
  const slug = form.values.title ? slugify(form.values.title) : "";
  const id = form.values.id || slug;
  const html = renderMarkdown(form.values.text);
  const values = { ...form.values, slug, html, id };
  if (form.values.image) {
    return read_image_from_file(form.values.image, true).then(image => ({
      ...form,
      values: { ...values, image }
    }));
  }
  return { ...form, values };
};

const MiniText = ({children}) => <span className="mini label">{children}</span>

const EventEditor = ({ action, onRemove, onSubmit, ...values }) => (
  <div>
    <Editor {...{ action, transform, validate, values, onSubmit }}>
      {({ values, errors }) => (
        <div>
          <Input name="id" type="hidden" values={values} errors={errors} />
          <Input name="title" type="text" values={values} errors={errors} />
          <hr/>
          <div className="flex two">
            <div>
              <Input label="date from" name="date_from" type="date" values={values} errors={errors} />
            </div>
            <div>
              <Input label="date to" name="date_to" type="date" values={values} errors={errors} />
            </div>
          </div>
          <MiniText>You may choose tentative starting and ending dates</MiniText>
          <Input name="flexible" type="checkbox" values={values} errors={errors} />
          <MiniText>If your dates are not set in stone, check this box</MiniText>
          <hr/>
          <div className="third">
            <Input name="ikar" type="select" values={values} errors={errors} items={[ {label:'Beirut'},{label:'Tripoli'}]} />
            <MiniText>Pick your region here</MiniText>
          </div>
          <br/>
          <hr/>
          <Input name="text" type="markdown" values={values} errors={errors} />
          <Input name="image" type="image" values={values} errors={errors} />
          <input type="submit" value="ok" />
        </div>
      )}
    </Editor>
    {action !== "create" && values && values.id ? (
      <button onClick={() => onRemove({ values })}>delete</button>
    ) : (
      false
    )}
  </div>
);

const Image = ({ratioHeight, url, description, process, id}) =>
  <div className="event-image">
    <Img alt={description} src={url} width="100%" height="100%"/>
  </div>

const Event = ({ full, ...props}) => 
  <div className={`event${full?' full':''}`}>
    { ( isEditMode() && full ) 
    ? <EventEditor action="update" { ...props }/>
    : <div>
        <div className="event-content">
          <h1>
            { full && <Title value={props.title}/>}
            <Link to={`/events/${props.slug}`}>{props.title}</Link>
          </h1>
          { props.date_from && props.date_to 
          ? <p>from { formatDate(props.date_from) } to { formatDate(props.date_to) }</p>
          : props.date_from 
          ? <p>{ formatDate(props.date_from) }</p>
          : null
          }
          <Pane value={props.html}/>
        </div>
        { props.image && <Image {...props.image}/>
        }
        { full
        ? <button style={{position:'absolute',bottom:10, left:10}}>apply to this</button>
        : <Link style={{position:'absolute',bottom:10, left:10}} to={`/events/${props.slug}`}>read more</Link>
        }
      </div>
    }
  </div>

export const Events = ({
  match: {
    params: { event: event_slug }
  }
}) => (
  <Page>
    <Content>
      <FirebaseProvider collection="events">
        {({ process, items, loading, updating }) => {
          if (loading) {
            return <Loading />;
          }
          const onSubmit = processSubmit(process);
          const onRemove = processRemove(process);
          const additionalProps = { event_slug, onRemove, onSubmit };
          if (!event_slug) {
            return items.map(article => (
              <Event
                key={article.id}
                {...article}
                {...additionalProps}
              />
            ));
          }
          if (event_slug === "new") {
            return <EventEditor action="create" {...additionalProps} />;
          }
          const article = items.find(({ slug }) => slug === event_slug);
          if (article) {
            return <Event full {...article} {...additionalProps} />;
          }
          return <div>not found</div>;
        }}
      </FirebaseProvider>
    </Content>
  </Page>
);
