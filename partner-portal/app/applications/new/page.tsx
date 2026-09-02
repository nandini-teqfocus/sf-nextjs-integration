import ApplicationForm from '@/components/applications/ApplicationForm';

export const metadata = {
  title: 'New Application | Partner Application Portal',
};

export default function NewApplicationPage() {
  return (
    <div className="py-4">
      <ApplicationForm />
    </div>
  );
}
