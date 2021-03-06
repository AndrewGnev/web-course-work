import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useQueryClient } from 'react-query';

import { AuthenticatedGuard } from '../../components/guards/AuthenticatedGuard';
import { Page } from '../../components/Page';
import { GlobalLayout } from '../../layouts/GlobalLayout/GlobalLayout';
import { BattleField } from '../../components/BattleField/BattleField';
import { useCurrentBattle } from '../../hooks/queries/useCurrentBattle';
import { BattleStage, StepStatus } from '../../api/data/Battle';
import { useMe } from '../../hooks/queries/useMe';
import { useCellChanging } from '../../hooks/mutation/useCellChanging';
import { useShotCell } from '../../hooks/mutation/useShotCell';
import { useCommitArrangement } from '../../hooks/mutation/useCommitArrangement';
import { ApiError } from '../../api/ApiError';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { QueryKey } from '../../queryClient';

import './BattlePage.css';


export interface BattlePageProps {
    className?: undefined;
}

const cnBattlePage = cn('BattlePage');

export const BattlePage: React.FC<BattlePageProps> = ({ className }) => {
    const { battle } = useCurrentBattle();
    const { me } = useMe();

    const changeCell = useCellChanging();

    const [error, setError] = useState('');

    const onMeCellClick = useCallback(async (x: number, y: number) => {
        try {
            await changeCell(x, y);
            setError('');
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.msg);
            }
        }
    }, [changeCell]);


    const commitArrangement = useCommitArrangement();

    const onCommitClick = useCallback(async () => {
        try {
            await commitArrangement();
            setError('');
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.msg);
            }
        }
    }, [commitArrangement]);


    const shotCell = useShotCell();

    const onEnemyCellClick = useCallback(async (x: number, y: number) => {
        try {
            await shotCell(x, y);
            setError('');
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.msg);
            }
        }
    }, [shotCell]);

    const queryClient = useQueryClient();
    useEffect(() => () => {
        if (battle?.stage === BattleStage.END) {
            queryClient.removeQueries(QueryKey.CURRENT_BATTLE);
        }
    }, [battle?.stage, queryClient]);

    const historyRef = React.useRef<HTMLDivElement>(null);
    const onHistoryScroll = useAutoScroll(historyRef, [battle?.stepsHistory], { scrollBehaviour: 'auto' });

    return (
        <AuthenticatedGuard redirectUrl="/login">
            <Page className={cnBattlePage(null, [className])} title="???????? ??????">
                <GlobalLayout className={cnBattlePage('Layout')}>
                    {battle === undefined || me === undefined ? (
                        <div className={cnBattlePage('Loading')}>
                            ????????????????...
                        </div>
                    ) : battle === null ? (
                        <div className={cnBattlePage('Loading')}>
                            ?????????? ???????????? ?????? ?? ???????????? ??????????????,
                            ???????????????? ???? ?????? ???????????? ?? ???????? ???????????? ?????????????? ???????? ?? ?????????????? "?????????????? ???? ??????"
                        </div>
                    ) : (
                        <>
                            <div className={cnBattlePage('BattleFields')}>
                                <div className={cnBattlePage('BattleFieldContainer')}>
                                    <div className={cnBattlePage('PlayerInfo')}>
                                        <div><strong>{battle.enemy.username}</strong></div>
                                        <div>????????: {battle.enemy.score}, ????????????: {battle.enemy.wins}, ??????????????????: {battle.enemy.loses}</div>
                                    </div>

                                    <BattleField field={battle.enemyField}
                                                 onCellClick={battle.stage === BattleStage.BATTLE
                                                 && battle.whoseTurn === 'ME' ? onEnemyCellClick : undefined} />
                                </div>

                                <div className={cnBattlePage('BattleFieldContainer')}>
                                    <div className={cnBattlePage('PlayerInfo')}>
                                        <div><strong>????</strong></div>
                                        <div>????????: {me.score}, ????????????: {me.wins}, ??????????????????: {me.loses}</div>
                                    </div>

                                    <BattleField field={battle.myField}
                                                 onCellClick={battle.stage === BattleStage.ARRANGEMENT
                                                    && !battle.playerCommitted
                                                    ? onMeCellClick : undefined} />
                                </div>
                            </div>

                            <div className={cnBattlePage('RightPart')}>
                                <div className={cnBattlePage('RightPartTop')}>
                                    {battle.stage === BattleStage.ARRANGEMENT && !battle.playerCommitted && (
                                        <>???????????????????? ??????????????</>
                                    )}
                                </div>

                                <div className={cnBattlePage('RightPartCenter')}>
                                    {battle.stage === BattleStage.ARRANGEMENT && (battle.playerCommitted ? (
                                        <>???????????????? ??????????????????</>
                                    ) : (
                                        <button className={cnBattlePage('ConfirmButton')} onClick={onCommitClick}>
                                            ??????????????????????
                                        </button>
                                    ))}

                                    {(battle.stage === BattleStage.BATTLE || battle.stage === BattleStage.END) && (
                                        <div ref={historyRef} className={cnBattlePage('StepsHistory')} onScroll={onHistoryScroll}>
                                            <div className={cnBattlePage('Step', { meta: true })}>???????? ????????????????</div>

                                            {battle.stepsHistory.map((step, index) => (
                                                <div key={index} className={cnBattlePage('Step', { shot: step.status === StepStatus.SHOT })}>
                                                    {step.username} : {step.x};{step.y} {step.status === StepStatus.SHOT ? '??????????' : '????????'}
                                                </div>
                                            ))}

                                            {battle.stage === BattleStage.BATTLE && (
                                                <div className={cnBattlePage('Step', { meta: true })}>
                                                    {battle.whoseTurn === 'ME' ? (
                                                        <>???????????? ?????? ??????</>
                                                    ) : (
                                                        <>???????????? ?????? ??????????????????</>
                                                    )}
                                                </div>
                                            )}

                                            {battle.stage === BattleStage.END && (
                                                <div className={cnBattlePage('Step', { meta: true })}>???????? ????????????????</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={cnBattlePage('RightPartBottom')}>
                                    {error && (
                                        <div className={cnBattlePage('Error')}>
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </GlobalLayout>
            </Page>
        </AuthenticatedGuard>
    );
};