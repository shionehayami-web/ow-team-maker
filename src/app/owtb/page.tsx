"use client";

import { useEffect, useRef, useState } from "react";

export default function OWTBPage() {
    type BoardState = {
        background: "black" | "white";
        mapOpacity: number;
        selectedMap: string;
        selectedPoint: string;
        rotation: 0 | 90 | 180 | 270;
        mapScale: number;
        mapOffsetX: number;
        mapOffsetY: number;
        drawingData: string | null;
        history: (string | null)[];
        future: (string | null)[];
    };

    const [mapMenuOpen, setMapMenuOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<string | null>(null);
    const [pointMenuOpen, setPointMenuOpen] = useState(false);


    const mapData = {
        control: {
            name: "コントロール",
            maps: [
                {
                    id: "lijiang-tower",
                    name: "LIJIANG TOWER",
                    points: [
                        {
                            id: "point-1",
                            name: "ポイント1",
                            image: "/maps/LT1.jpg",
                        },
                        {
                            id: "point-2",
                            name: "ポイント2",
                            image: "/maps/LT2.jpg",
                        },
                        {
                            id: "point-3",
                            name: "ポイント3",
                            image: "/maps/LT3.jpg",
                        },
                    ],
                },
            ],
        },

        escort: {
            name: "エスコート",
            maps: [],
        },

        hybrid: {
            name: "ハイブリッド",
            maps: [],
        },

        push: {
            name: "プッシュ",
            maps: [],
        },

        flashpoint: {
            name: "フラッシュポイント",
            maps: [],
        },
    };

    const initialBoards: BoardState[] = [
        {
            background: "black",
            mapOpacity: 100,
            selectedMap: "lijiang-tower",
            selectedPoint: "point-1",
            rotation: 0,
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            drawingData: null,
            history: [],
            future: [],
        },
        {
            background: "black",
            mapOpacity: 100,
            selectedMap: "lijiang-tower",
            selectedPoint: "point-1",
            rotation: 0,
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            drawingData: null,
            history: [],
            future: [],
        },
        {
            background: "black",
            mapOpacity: 100,
            selectedMap: "lijiang-tower",
            selectedPoint: "point-1",
            rotation: 0,
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            drawingData: null,
            history: [],
            future: [],
        },
        {
            background: "black",
            mapOpacity: 100,
            selectedMap: "lijiang-tower",
            selectedPoint: "point-1",
            rotation: 0,
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            drawingData: null,
            history: [],
            future: [],
        },
        {
            background: "black",
            mapOpacity: 100,
            selectedMap: "lijiang-tower",
            selectedPoint: "point-1",
            rotation: 0,
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            drawingData: null,
            history: [],
            future: [],
        },
    ];


    const [activeBoard, setActiveBoard] = useState(1);

    const [boards, setBoards] = useState<BoardState[]>(initialBoards);

    const currentBoard = boards[activeBoard - 1];

    const allMaps = Object.values(mapData).flatMap((rule) => rule.maps);

    const currentMap =
        allMaps.find((map) => map.id === currentBoard.selectedMap) ?? null;

    const currentPoint =
        currentMap?.points.find(
            (point) => point.id === currentBoard.selectedPoint
        ) ?? null;


    const changeBackground = () => {
        setBoards((prev) =>
            prev.map((board, index) =>
                index === activeBoard - 1
                    ? {
                        ...board,
                        background:
                            board.background === "black" ? "white" : "black",
                    }
                    : board
            )
        );
    };

    const changeMapOpacity = (value: number) => {
        setBoards((prev) =>
            prev.map((board, index) =>
                index === activeBoard - 1
                    ? {
                        ...board,
                        mapOpacity: value,
                    }
                    : board
            )
        );
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const board = boardRef.current;

        if (!canvas || !board) return;

        const restoreDrawing = () => {
            canvas.width = board.clientWidth;
            canvas.height = board.clientHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!currentBoard.drawingData) return;

            const image = new Image();

            image.onload = () => {
                ctx.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            };

            image.src = currentBoard.drawingData;
        };

        restoreDrawing();

        window.addEventListener("resize", restoreDrawing);

        return () => {
            window.removeEventListener("resize", restoreDrawing);
        };
    }, [activeBoard, currentBoard.drawingData]);

    const getCanvasPosition = (
        e: React.MouseEvent<HTMLCanvasElement>
    ) => getLogicalPositionFromClient(e.clientX, e.clientY);

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const drawingData = canvas.toDataURL();

        setBoards((prev) =>
            prev.map((board, index) =>
                index === activeBoard - 1
                    ? {
                        ...board,
                        history: [...board.history, board.drawingData],
                        drawingData,
                        future: [],
                    }
                    : board
            )
        );
    };

    const undoDrawing = () => {
        setBoards((prev) =>
            prev.map((board, index) => {
                if (index !== activeBoard - 1) return board;
                if (board.history.length === 0) return board;

                const previousDrawing =
                    board.history[board.history.length - 1];

                return {
                    ...board,
                    drawingData: previousDrawing,
                    history: board.history.slice(0, -1),
                    future: [board.drawingData, ...board.future],
                };
            })
        );
    };

    const redoDrawing = () => {
        setBoards((prev) =>
            prev.map((board, index) => {
                if (index !== activeBoard - 1) return board;
                if (board.future.length === 0) return board;

                const nextDrawing = board.future[0];

                return {
                    ...board,
                    history: [...board.history, board.drawingData],
                    drawingData: nextDrawing,
                    future: board.future.slice(1),
                };
            })
        );
    };


    const startDrawing = (
        e: React.MouseEvent<HTMLCanvasElement>
    ) => {
        if (activeTool !== "pen" && activeTool !== "eraser") return;


        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCanvasPosition(e);

        isDrawingRef.current = true;

        ctx.beginPath();
        ctx.moveTo(x, y);

        const penThicknessValues = [2, 4, 6, 8, 10];
        const eraserThicknessValues = [10, 18, 26, 34, 42];

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (activeTool === "pen") {
            ctx.globalCompositeOperation = "source-over";
            ctx.lineWidth = penThicknessValues[toolThickness - 1];
            ctx.strokeStyle = penColor;
        }

        if (activeTool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = eraserThicknessValues[toolThickness - 1];
        }
    };

    const draw = (
        e: React.MouseEvent<HTMLCanvasElement>
    ) => {
        updateDrawingCursor(e);
        if (!isDrawingRef.current) return;
        if (activeTool !== "pen" && activeTool !== "eraser") return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCanvasPosition(e);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;

        isDrawingRef.current = false;
        saveDrawing();
    };

    const [activeTool, setActiveTool] = useState<
        "cursor" | "map" | "pen" | "eraser"
    >("cursor");

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const isDrawingRef = useRef(false);

    const isPanningRef = useRef(false);
    const panStartRef = useRef({
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
    });

    const getViewTransform = () =>
        `translate(${currentBoard.mapOffsetX}px, ${currentBoard.mapOffsetY}px) rotate(${currentBoard.rotation}deg) scale(${currentBoard.mapScale})`;

    const getLogicalPositionFromClient = (clientX: number, clientY: number) => {
        const board = boardRef.current;

        if (!board) {
            return { x: 0, y: 0 };
        }

        const rect = board.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const translatedX = clientX - centerX - currentBoard.mapOffsetX;
        const translatedY = clientY - centerY - currentBoard.mapOffsetY;

        const radians = (-currentBoard.rotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const rotatedX = translatedX * cos - translatedY * sin;
        const rotatedY = translatedX * sin + translatedY * cos;

        return {
            x: rotatedX / currentBoard.mapScale + rect.width / 2,
            y: rotatedY / currentBoard.mapScale + rect.height / 2,
        };
    };

    const startMapPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool !== "map") return;

        isPanningRef.current = true;
        panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: currentBoard.mapOffsetX,
            offsetY: currentBoard.mapOffsetY,
        };
    };

    const moveMapPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanningRef.current || activeTool !== "map") return;

        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;

        setBoards((prev) =>
            prev.map((board, index) =>
                index === activeBoard - 1
                    ? {
                        ...board,
                        mapOffsetX: panStartRef.current.offsetX + dx,
                        mapOffsetY: panStartRef.current.offsetY + dy,
                    }
                    : board
            )
        );
    };

    const stopMapPan = () => {
        isPanningRef.current = false;
    };

    const zoomMap = (e: React.WheelEvent<HTMLDivElement>) => {
        if (activeTool !== "map") return;

        e.preventDefault();

        const zoomStep = e.deltaY < 0 ? 0.1 : -0.1;

        setBoards((prev) =>
            prev.map((board, index) => {
                if (index !== activeBoard - 1) return board;

                const nextScale = Math.max(
                    0.5,
                    Math.min(3, Number((board.mapScale + zoomStep).toFixed(2)))
                );

                return {
                    ...board,
                    mapScale: nextScale,
                };
            })
        );
    };

    const resetMapView = () => {
        setBoards((prev) =>
            prev.map((board, index) =>
                index === activeBoard - 1
                    ? {
                        ...board,
                        mapScale: 1,
                        mapOffsetX: 0,
                        mapOffsetY: 0,
                    }
                    : board
            )
        );
    };

    const rotateBoard = (direction: "left" | "right") => {
        setBoards((prev) =>
            prev.map((board, index) => {
                if (index !== activeBoard - 1) return board;

                const nextRotation =
                    direction === "right"
                        ? (board.rotation + 90) % 360
                        : (board.rotation + 270) % 360;

                return {
                    ...board,
                    rotation: nextRotation as 0 | 90 | 180 | 270,
                };
            })
        );
    };

    const [cursorPosition, setCursorPosition] = useState({
        x: 0,
        y: 0,
    });

    const updateDrawingCursor = (
        e: React.MouseEvent<HTMLCanvasElement>
    ) => {
        const board = boardRef.current;
        if (!board) return;

        const rect = board.getBoundingClientRect();

        setCursorPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setCursorVisible(true);
    };

    const [cursorVisible, setCursorVisible] = useState(false);

    const [toolThickness, setToolThickness] = useState(3);
    const [penColor, setPenColor] = useState("#ff0000");

    const [thicknessMenuOpen, setThicknessMenuOpen] = useState(false);
    const [colorMenuOpen, setColorMenuOpen] = useState(false);

    const penColors = [
        { name: "白", value: "#ffffff" },
        { name: "黒", value: "#000000" },
        { name: "赤", value: "#ff0000" },
        { name: "青", value: "#2563eb" },
        { name: "緑", value: "#22c55e" },
        { name: "ピンク", value: "#ec4899" },
        { name: "水色", value: "#38bdf8" },
    ];



    return (
        <main className="owtb-page">
            <header className="owtb-header">
                <h1>OWTB</h1>
                <span>Overwatch Tactical Board</span>
            </header>

            {/* 上1段目 */}
            <section className="top-row">
                <div className="map-menu-wrapper">
                    <button
                        onClick={() => {
                            setMapMenuOpen(!mapMenuOpen);
                            setSelectedRule(null);
                        }}
                    >
                        マップ選択
                    </button>

                    {mapMenuOpen && (
                        <div className="map-menu">
                            {selectedRule === null ? (
                                <>
                                    {Object.entries(mapData).map(([ruleId, rule]) => (
                                        <button
                                            key={ruleId}
                                            className="map-menu-button"
                                            onClick={() => setSelectedRule(ruleId)}
                                        >
                                            {rule.name}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <button
                                        className="map-back-button"
                                        onClick={() => setSelectedRule(null)}
                                    >
                                        ← ルール一覧
                                    </button>

                                    <div className="map-menu-title">
                                        {
                                            mapData[selectedRule as keyof typeof mapData]
                                                .name
                                        }
                                    </div>

                                    {mapData[
                                        selectedRule as keyof typeof mapData
                                    ].maps.length > 0 ? (
                                        mapData[
                                            selectedRule as keyof typeof mapData
                                        ].maps.map((map) => (
                                            <button
                                                key={map.id}
                                                className="map-menu-button"
                                                onClick={() => {
                                                    setBoards((prev) =>
                                                        prev.map((board, index) =>
                                                            index === activeBoard - 1
                                                                ? {
                                                                    ...board,
                                                                    selectedMap: map.id,
                                                                    selectedPoint: map.points[0]?.id ?? "",
                                                                    mapScale: 1,
                                                                    mapOffsetX: 0,
                                                                    mapOffsetY: 0,
                                                                }
                                                                : board
                                                        )
                                                    );

                                                    setMapMenuOpen(false);
                                                    setSelectedRule(null);
                                                }}
                                            >
                                                {map.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="map-menu-empty">
                                            マップ未登録
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="point-menu-wrapper">
                    <button
                        onClick={() => setPointMenuOpen(!pointMenuOpen)}
                        disabled={!currentMap}
                    >
                        ポイント選択
                    </button>

                    {pointMenuOpen && currentMap && (
                        <div className="point-menu">
                            {currentMap.points.map((point) => (
                                <button
                                    key={point.id}
                                    className="point-menu-button"
                                    onClick={() => {
                                        setBoards((prev) =>
                                            prev.map((board, index) =>
                                                index === activeBoard - 1
                                                    ? {
                                                        ...board,
                                                        selectedPoint: point.id,
                                                        mapScale: 1,
                                                        mapOffsetX: 0,
                                                        mapOffsetY: 0,
                                                    }
                                                    : board
                                            )
                                        );

                                        setPointMenuOpen(false);
                                    }}
                                >
                                    {point.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    title="左に90°回転"
                    onClick={() => rotateBoard("left")}
                >
                    ↺ 90°
                </button>
                <button
                    title="右に90°回転"
                    onClick={() => rotateBoard("right")}
                >
                    ↻ 90°
                </button>

                <div className="board-tabs">
                    {[1, 2, 3, 4, 5].map((boardNumber) => (
                        <button
                            key={boardNumber}
                            className={activeBoard === boardNumber ? "active-board" : ""}
                            onClick={() => setActiveBoard(boardNumber)}
                        >
                            Board {boardNumber}
                        </button>
                    ))}
                </div>
            </section>

            {/* 上2段目 */}
            <section className="second-row">
                <button
                    onClick={undoDrawing}
                    disabled={currentBoard.history.length === 0}
                >
                    ↶ 戻る
                </button>

                <button
                    onClick={redoDrawing}
                    disabled={currentBoard.future.length === 0}
                >
                    ↷ 進む
                </button>

                <label>
                    マップ不透明度
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentBoard.mapOpacity}
                        onChange={(e) => changeMapOpacity(Number(e.target.value))}
                    />
                    <span>{currentBoard.mapOpacity}%</span>
                </label>

                <button onClick={changeBackground}>
                    背景：{currentBoard.background === "black" ? "黒" : "白"}
                </button>
            </section>

            {/* 中段 */}
            <section className="main-area">
                {/* 左側ツールバー */}
                <aside className="drawing-toolbar">
                    <button
                        title="カーソル"
                        className={activeTool === "cursor" ? "active-tool" : ""}
                        onClick={() => setActiveTool("cursor")}
                    >
                        ↖
                    </button>

                    <button
                        title="マップ移動・拡大縮小"
                        className={activeTool === "map" ? "active-tool" : ""}
                        onClick={() => setActiveTool("map")}
                    >
                        ✥
                    </button>

                    <button
                        title="ペン"
                        className={activeTool === "pen" ? "active-tool" : ""}
                        onClick={() => setActiveTool("pen")}
                    >
                        ✎
                    </button>

                    <button
                        title="消しゴム"
                        className={activeTool === "eraser" ? "active-tool" : ""}
                        onClick={() => setActiveTool("eraser")}
                    >
                        ▱
                    </button>


                    <div className="tool-menu-wrapper">
                        <button
                            title="太さ"
                            onClick={() => {
                                setThicknessMenuOpen(!thicknessMenuOpen);
                                setColorMenuOpen(false);
                            }}
                        >
                            {["①", "②", "③", "④", "⑤"][toolThickness - 1]}
                        </button>

                        {thicknessMenuOpen && (
                            <div className="tool-menu thickness-menu">
                                {[1, 2, 3, 4, 5].map((thickness) => (
                                    <button
                                        key={thickness}
                                        className={
                                            toolThickness === thickness
                                                ? "thickness-option active-option"
                                                : "thickness-option"
                                        }
                                        onClick={() => {
                                            setToolThickness(thickness);
                                            setThicknessMenuOpen(false);
                                        }}
                                    >
                                        {["①", "②", "③", "④", "⑤"][thickness - 1]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="tool-menu-wrapper">
                        <button
                            title="色"
                            onClick={() => {
                                setColorMenuOpen(!colorMenuOpen);
                                setThicknessMenuOpen(false);
                            }}
                        >
                            <span
                                className="current-color"
                                style={{
                                    background: penColor,
                                    borderColor:
                                        penColor === "#ffffff" ? "#000000" : "#ffffff",
                                }}
                            />
                        </button>

                        {colorMenuOpen && (
                            <div className="tool-menu color-menu">
                                {penColors.map((color) => (
                                    <button
                                        key={color.value}
                                        title={color.name}
                                        className={
                                            penColor === color.value
                                                ? "color-option active-option"
                                                : "color-option"
                                        }
                                        onClick={() => {
                                            setPenColor(color.value);
                                            setColorMenuOpen(false);
                                        }}
                                    >
                                        <span
                                            className="color-circle"
                                            style={{
                                                background: color.value,
                                                borderColor:
                                                    color.value === "#ffffff"
                                                        ? "#000000"
                                                        : "#ffffff",
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        title="クリア"
                        onClick={() => {
                            const ok = window.confirm(
                                `Board ${activeBoard} の描画をすべて削除しますか？`
                            );

                            if (!ok) return;

                            const canvas = canvasRef.current;
                            if (!canvas) return;

                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;

                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            setBoards((prev) =>
                                prev.map((board, index) =>
                                    index === activeBoard - 1
                                        ? {
                                            ...board,
                                            history: [...board.history, board.drawingData],
                                            drawingData: null,
                                            future: [],
                                        }
                                        : board
                                )
                            );
                        }}
                    >
                        🗑
                    </button>
                </aside>

                {/* 中央パレット */}
                <div className="board-area">
                    <div
                        ref={boardRef}
                        className={`board-placeholder ${
                            activeTool === "map" ? "map-edit-mode" : ""
                        }`}
                        style={{
                            background:
                                currentBoard.background === "black" ? "#000000" : "#ffffff",
                        }}
                        onMouseDown={startMapPan}
                        onMouseMove={moveMapPan}
                        onMouseUp={stopMapPan}
                        onMouseLeave={stopMapPan}
                        onWheel={zoomMap}
                    >
                        <img
                            src={currentPoint?.image ?? "/maps/LT1.jpg"}
                            alt="Map"
                            className="map-image"
                            style={{
                                opacity: currentBoard.mapOpacity / 100,
                                transform: getViewTransform(),
                                transformOrigin: "center center",
                            }}
                            draggable={false}
                        />

                        <canvas
                            ref={canvasRef}
                            className={`drawing-canvas ${activeTool === "pen" || activeTool === "eraser"
                                ? "drawing-enabled"
                                : ""
                                }`}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseEnter={() => setCursorVisible(true)}
                            onMouseUp={stopDrawing}
                            onMouseLeave={() => {
                                stopDrawing();
                                setCursorVisible(false);
                            }}
                            style={{
                                transform: getViewTransform(),
                                transformOrigin: "center center",
                            }}
                        />

                        {cursorVisible &&
                            (activeTool === "pen" || activeTool === "eraser") && (
                                <div
                                    className={`drawing-cursor ${activeTool === "eraser"
                                        ? "eraser-cursor"
                                        : "pen-cursor"
                                        }`}
                                    style={{
                                        left: cursorPosition.x,
                                        top: cursorPosition.y,
                                        width:
                                            activeTool === "pen"
                                                ? [2, 4, 6, 8, 10][toolThickness - 1]
                                                : [10, 18, 26, 34, 42][toolThickness - 1],
                                        height:
                                            activeTool === "pen"
                                                ? [2, 4, 6, 8, 10][toolThickness - 1]
                                                : [10, 18, 26, 34, 42][toolThickness - 1],
                                        color:
                                            activeTool === "pen"
                                                ? penColor
                                                : "transparent",
                                    }}
                                />
                            )}



                        <div
                            className="board-number"
                            style={{
                                color:
                                    currentBoard.background === "black"
                                        ? "#ffffff"
                                        : "#555555",
                            }}
                        >
                            Board {activeBoard}
                        </div>

                        <div className="map-view-status">
                            <span>{Math.round(currentBoard.mapScale * 100)}%</span>
                            {(currentBoard.mapScale !== 1 ||
                                currentBoard.mapOffsetX !== 0 ||
                                currentBoard.mapOffsetY !== 0) && (
                                <button
                                    type="button"
                                    onClick={resetMapView}
                                    title="表示位置と倍率をリセット"
                                >
                                    リセット
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 下段 */}
            <section className="hero-area">
                <div className="hero-row">
                    <strong>TANK</strong>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                </div>

                <div className="hero-row">
                    <strong>DAMAGE</strong>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                </div>

                <div className="hero-row">
                    <strong>SUPPORT</strong>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                </div>

                <div className="hero-row">
                    <strong>OBJECT</strong>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                    <div className="hero-placeholder">○</div>
                </div>
            </section>

            <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .owtb-page {
          min-height: 100vh;
          background: #161616;
          color: white;
          padding: 12px;
          font-family: Arial, sans-serif;
        }

        .owtb-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 10px;
        }

        .owtb-header h1 {
          margin: 0;
          font-size: 28px;
        }

        .owtb-header span {
          opacity: 0.7;
          font-size: 14px;
        }

        .top-row,
        .second-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #252525;
          border: 1px solid #444;
        }

        .second-row {
          border-top: none;
        }

        button {
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
        }

        button:hover {
          background: #444;
        }

        .board-tabs {
          display: flex;
          gap: 5px;
          margin-left: auto;
        }

        .second-row label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .main-area {
          display: flex;
          height: calc(100vh - 260px);
          min-height: 560px;
          margin-top: 10px;
        }

        .drawing-toolbar {
          width: 58px;
          background: #252525;
          border: 1px solid #444;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 8px 6px;
        }

        .drawing-toolbar button {
          width: 42px;
          height: 42px;
          padding: 0;
          font-size: 18px;
        }

        .board-area {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          background: #202020;
          border-top: 1px solid #444;
          border-right: 1px solid #444;
          border-bottom: 1px solid #444;
          overflow: hidden;
        }

        .board-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  overflow: hidden;
  border-radius: 0;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  pointer-events: none;
}

.map-image,
.drawing-canvas {
  transition: transform 0.08s ease-out;
}

.board-placeholder.map-edit-mode {
  cursor: grab;
}

.board-placeholder.map-edit-mode:active {
  cursor: grabbing;
}

.map-view-status {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 12px;
  pointer-events: auto;
}

.map-view-status button {
  width: auto !important;
  height: auto !important;
  padding: 3px 7px !important;
  font-size: 11px !important;
}

.board-number {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 10;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

        .hero-area {
          margin-top: 10px;
          padding: 10px;
          background: #252525;
          border: 1px solid #444;
        }

        .hero-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .hero-row:last-child {
          margin-bottom: 0;
        }

        .hero-row strong {
          width: 90px;
          font-size: 13px;
        }

        .hero-placeholder {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #444;
        }

        .active-board {
  background: #2563eb;
  border-color: #60a5fa;
}

.active-board:hover {
  background: #2563eb;
}


.board-number {
  color: #555;
  font-size: 18px;
  margin-bottom: 12px;
  font-weight: bold;
}

.map-menu-wrapper {
  position: relative;
}

.map-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 220px;
  background: #252525;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 6px;
  z-index: 1000;
}

.map-menu-button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 10px 12px;
}

.map-menu-button:hover {
  background: #444;
}

.map-back-button {
  width: 100%;
  text-align: left;
  background: #333;
  margin-bottom: 6px;
}

.map-menu-title {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
  border-bottom: 1px solid #444;
  margin-bottom: 4px;
}

.map-menu-empty {
  padding: 12px;
  color: #888;
  font-size: 13px;
}

.point-menu-wrapper {
  position: relative;
}

.point-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 160px;
  background: #252525;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 6px;
  z-index: 1000;
}

.point-menu-button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 10px 12px;
}

.point-menu-button:hover {
  background: #444;
}

.drawing-toolbar .active-tool {
  background: #2563eb;
  border-color: #60a5fa;
}

.drawing-toolbar .active-tool:hover {
  background: #2563eb;
}

.drawing-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.drawing-canvas.drawing-enabled {
  pointer-events: auto;
  cursor: crosshair;
}

.tool-menu-wrapper {
  position: relative;
}

.tool-menu {
  position: absolute;
  left: calc(100% + 8px);
  top: 0;
  display: flex;
  gap: 6px;
  padding: 6px;
  background: #252525;
  border: 1px solid #555;
  border-radius: 6px;
  z-index: 2000;
}

.drawing-toolbar .tool-menu button {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.thickness-menu {
  flex-direction: row;
}

.thickness-option {
  font-size: 18px;
}

.drawing-toolbar .active-option {
  background: #2563eb;
  border-color: #60a5fa;
}

.current-color {
  display: block;
  width: 20px;
  height: 20px;
  margin: auto;
  border: 2px solid;
  border-radius: 50%;
}

.color-menu {
  flex-direction: row;
}

.color-option {
  padding: 0 !important;
}

.color-circle {
  display: block;
  width: 22px;
  height: 22px;
  margin: auto;
  border: 2px solid;
  border-radius: 50%;
}

.drawing-canvas.drawing-enabled {
  pointer-events: auto;
}

.drawing-canvas.drawing-enabled {
  cursor: crosshair;
}

.drawing-canvas.drawing-enabled {
  pointer-events: auto;
  cursor: none;
}

.drawing-cursor {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 20;
  box-sizing: border-box;
  
}

.pen-cursor {
  border: 1px solid white;
  background: currentColor;
}

.eraser-cursor {
  border: 1px solid white;
  background: rgba(255, 255, 255, 0.2);
}

        @media (max-width: 900px) {
          .top-row,
          .second-row {
            flex-wrap: wrap;
          }

          .board-tabs {
            margin-left: 0;
          }

          .main-area {
            height: calc(100vh - 310px);
            min-height: 460px;
          }
        }
      `}</style>
        </main>
    );
}

