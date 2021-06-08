import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const readingWords = post.data.content.reduce((words, obj) => {
    const headingWords = obj.heading.split(' ').length;
    const bodyWords = obj.body.reduce(
      (wordsCount, obj2) => obj2.text.split(' ').length + wordsCount,
      0
    );
    return bodyWords + headingWords + words;
  }, 0);

  const readingMinutes = Math.ceil(readingWords / 200);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <Header />
      <img className={styles.image} src={post.data.banner.url} alt="banner" />
      <main className={styles.container}>
        <header>
          <strong>{post.data.title}</strong>
          <div>
            <div>
              <FiCalendar color="#BBBBBB" />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div>
              <FiUser color="#BBBBBB" />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock color="#BBBBBB" />
              <span>{readingMinutes} min</span>
            </div>
          </div>
        </header>
        <section>
          {post.data.content.map((content, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index}>
              <strong className={styles.title}>{content.heading}</strong>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 min
  };
};
