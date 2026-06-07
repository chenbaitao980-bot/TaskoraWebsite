// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://taskora-website-eta.vercel.app',
  adapter: vercel(),
  integrations: [
    starlight({
      title: 'Taskora',
      logo: {
        src: './src/assets/logo.png',
        replacesTitle: false,
      },
      defaultLocale: 'zh-CN',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/pbtcbt/taskora' },
      ],
      sidebar: [
        {
          label: '开始使用',
          items: [
            { label: '快速上手', slug: 'docs/getting-started' },
          ],
        },
        {
          label: '功能详解',
          items: [
            { label: '任务管理', slug: 'docs/features/tasks' },
            { label: 'AI 智能拆分', slug: 'docs/features/ai-decompose' },
            { label: '日历排程', slug: 'docs/features/calendar' },
            { label: '思维导图', slug: 'docs/features/mind-map' },
            { label: '提醒通知', slug: 'docs/features/reminders' },
            { label: '云同步', slug: 'docs/features/sync' },
            { label: '数据导出', slug: 'docs/features/export' },
          ],
        },
        {
          label: '更多',
          items: [
            { label: 'VIP 会员', slug: 'docs/vip' },
            { label: '常见问题', slug: 'docs/faq' },
          ],
        },
      ],
      customCss: ['./src/styles/global.css'],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
