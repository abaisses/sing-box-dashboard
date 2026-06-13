import { isTerminalCode, type StreamSnapshot } from "../api/stream";
import { useStreamOutage } from "../app/hooks";
import { useI18n, type MessageKey } from "../app/i18n";
import { Icon, type IconName } from "./Icon";
import { EmptyState } from "./ui";

export function StreamErrorBanner(props: { error: string | null; subject: MessageKey }) {
  const { t } = useI18n();
  if (props.error === null) {
    return null;
  }
  return (
    <div className="banner error">
      <Icon name="warning_amber" />
      <div>
        {t("Failed to subscribe to {subject}: {error}", {
          subject: t(props.subject),
          error: props.error,
        })}
        <div className="hint">{t("Check the server address and secret in Settings.")}</div>
      </div>
    </div>
  );
}

export function StreamBanner(props: { snapshot: StreamSnapshot<unknown>; subject: MessageKey }) {
  const outage = useStreamOutage(props.snapshot, isTerminalCode(props.snapshot.errorCode));
  return <StreamErrorBanner error={outage} subject={props.subject} />;
}

export function StreamStates(props: {
  snapshot: StreamSnapshot<unknown>;
  subject: MessageKey;
  loaded: boolean;
  empty: boolean;
  emptyIcon?: IconName;
  emptyMessage: string;
}) {
  const { t } = useI18n();
  const outage = useStreamOutage(props.snapshot, isTerminalCode(props.snapshot.errorCode));
  return (
    <>
      <StreamErrorBanner error={outage} subject={props.subject} />
      {!props.loaded && outage === null && <EmptyState>{t("Loading...")}</EmptyState>}
      {props.loaded && props.empty && (
        <EmptyState icon={props.emptyIcon}>{props.emptyMessage}</EmptyState>
      )}
    </>
  );
}
