import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CaseStudyHeader } from '@schoolerp/ui';

const meta: Meta<typeof CaseStudyHeader> = {
  title: 'Growth/CaseStudyHeader',
  component: CaseStudyHeader,
};

export default meta;
type Story = StoryObj<typeof CaseStudyHeader>;

export const Default: Story = {
  args: {
    title: 'Transforming Academic Operations at scale',
    schoolName: 'Vikas International School',
    city: 'Pune',
    studentCount: 3500,
    category: 'Operational Efficiency',
  },
};
