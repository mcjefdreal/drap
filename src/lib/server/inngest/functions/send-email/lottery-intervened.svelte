<script lang="ts">
  import { Heading, Section, Text } from 'better-svelte-email';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    studentName: string;
    studentEmail: string;
    labName: string;
    draftId: number;
  }

  const { studentName, studentEmail, labName, draftId }: Props = $props();
</script>

<EmailLayout preview="Manual assignment notification - Draft #{draftId}">
  <Section>
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1"
        >Manual Assignment Completed</Heading
      >
      <Text class="text-sm text-muted-foreground">
        This assignment was made through administrative intervention during the lottery phase.
      </Text>
    </Section>
    <Section class="px-4 pb-4">
      <Section class="mx-auto max-w-md rounded-lg bg-card p-4 text-card-foreground">
        <Text class="font-semibold">Assignment Details</Text>
        <Text class="mt-2 text-base leading-relaxed">
          <strong>Student:</strong>
          {studentName}<br />
          <strong>Email:</strong>
          {studentEmail}<br />
          <strong>Assigned to:</strong>
          {labName}
        </Text>
      </Section>
    </Section>
  </Section>
</EmailLayout>
