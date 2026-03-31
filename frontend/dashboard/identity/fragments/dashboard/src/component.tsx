'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button'

export function DashboardComponent(): ReactNode {

    return (
        <Box
            width={"$full"}
            backgroundColor={"$cardBg"}
            borderRadius={30}
            border="1px solid"
            borderColor={"$border"}
            alignItems={"center"}
            justifyContent={"center"}
            paddingLeft={300}
            paddingRight={300}
            flexDirection={"column"}
            gap={10}
        >
            <Box flexDirection={"column"} gap={10}>
                <Text
                    size={36}
                    font={"$rus"}
                    textAlign={"center"}
                >
                    Платформа для совместной
                    <br />
                    работы над кодом с AI-ревьюером
                </Text>

                <Text
                    size={20}
                    color={"$secondaryText"}
                    textAlign={"center"}
                    font={"$footer"}
                >
                    Пишите код вместе, отслеживайте изменения и получайте AI-подсказки
                    <br />
                    прямо в редакторе.
                </Text>
            </Box>
            <Box flexDirection={"row"} gap={10} padding={10}>
                <Button
                    type="link"
                    href="/room"
                    variant="filled"
                    height={80}
                    minWidth={375}
                    padding={10}
                    borderRadius={45}
                    bg="#43953D"
                    textColor="#FFFFFF"
                >
                    <Text size={24}>
                        Создать комнату
                    </Text>
                </Button>
                <Button
                    type="link"
                    href="/join"
                    padding={25}
                    height={80}
                    minWidth={375}
                    border="1px solid"
                    borderColor="$border"
                    borderRadius={45}
                    textColor="#FFFFFF"
                >
                    <Text size={24}>
                        Присоединиться
                    </Text>
                </Button>
            </Box>
        </Box>
    );
}
