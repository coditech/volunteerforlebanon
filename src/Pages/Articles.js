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
  Page,
  Content,
  Pane,
  Link,
  FullWidthImage,
  Loading,
  Title,
  Editor,
  FormControl as Input,
  FirebaseProvider
} from "../Components";

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

const ArticleEditor = ({ action, onRemove, onSubmit, ...values }) => (
  <div>
    <Editor {...{ action, transform, validate, values, onSubmit }}>
      {({ values, errors }) => (
        <div>
          <Input name="id" type="hidden" values={values} errors={errors} />
          <Input name="title" type="text" values={values} errors={errors} />
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

const Article = props =>
  isEditMode() ? (
    <ArticleEditor action="update" {...props} />
  ) : (
    <div>
      <Title value={props.title} />
      {props.image && <FullWidthImage {...props.image} />}
      <h1>{props.title}</h1>
      <Pane value={props.html} />
    </div>
  );

const ArticleSummary = ({ slug, title }) => (
  <h3>
    <Link to={`/articles/${slug}`}>{title}</Link>
  </h3>
);

export const Articles = ({
  match: {
    params: { article: article_slug }
  }
}) => (
  <Page>
    <Content>
      <FirebaseProvider collection="articles">
        {({ process, items, loading, updating }) => {
          if (loading) {
            return <Loading />;
          }
          const onSubmit = processSubmit(process);
          const onRemove = processRemove(process);
          const additionalProps = { article_slug, onRemove, onSubmit };
          if (!article_slug) {
            return items.map(article => (
              <ArticleSummary
                key={article.id}
                {...article}
                {...additionalProps}
              />
            ));
          }
          if (article_slug === "new") {
            return <ArticleEditor action="create" {...additionalProps} />;
          }
          const article = items.find(({ slug }) => slug === article_slug);
          if (article) {
            return <Article {...article} {...additionalProps} />;
          }
          return <div>not found</div>;
        }}
      </FirebaseProvider>
    </Content>
  </Page>
);
