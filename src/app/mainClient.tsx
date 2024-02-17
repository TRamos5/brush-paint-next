"use client";

import { useEffect, useRef, useState } from "react";
import "./page.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
	faBrush,
	faFillDrip,
	faEraser,
	faUndoAlt,
	faDownload,
	faUpload,
	faTrashAlt,
	faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";

interface Position {
	x: number;
	y: number;
}

export default function Canvas() {
	const brushColorBoxRef = useRef(null);
	const brushColorPickerRef = useRef(null);
	const bucketColorBoxRef = useRef(null);
	const bucketColorPickerRef = useRef(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// state for top bar
	const [activeTool, setActiveTool] = useState("Brush");
	const [brushColor, setBrushColor] = useState("#000000");
	const [previousBrushSettings, setPreviousBrushSettings] = useState({
		color: "",
		size: 10,
	});
	const [brushColorOpenToggle, setBrushColorOpenToggle] = useState(false);
	const [bucketColor, setBucketColor] = useState("#ffffff");
	const [bucketColorOpenToggle, setBucketColorOpenToggle] = useState(false);
	const [brushCurrentSize, setBrushCurrentSize] = useState(10);
	const [loadingFromLocalStorage, setLoadingFromLocalStorage] = useState(false);

	// state for canvas
	const [drawnArray, setDrawnArray] = useState<
		{ x: any; y: any; size: any; color: any; erase: any; newStroke: any }[]
	>([]);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const [isEraser, setIsEraser] = useState(false);
	const [context, setContext] = useState<
		CanvasRenderingContext2D | null | undefined
	>(null);

	useEffect(() => {
		function handleClickOutside(event: { target: any }) {
			if (
				brushColorOpenToggle &&
				brushColorBoxRef.current &&
				!(brushColorBoxRef.current as HTMLElement).contains(event.target) &&
				brushColorPickerRef.current &&
				!(brushColorPickerRef.current as HTMLElement).contains(event.target)
			) {
				setBrushColorOpenToggle(false);
			}

			if (
				bucketColorOpenToggle &&
				bucketColorBoxRef.current &&
				!(bucketColorBoxRef.current as HTMLElement).contains(event.target) &&
				bucketColorPickerRef.current &&
				!(bucketColorPickerRef.current as HTMLElement).contains(event.target)
			) {
				setBucketColorOpenToggle(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [brushColorOpenToggle, bucketColorOpenToggle]);

	const getMousePosition = (event: MouseEvent): Position => {
		const canvas = canvasRef.current;
		return {
			x: event.clientX - (canvas?.offsetLeft || 0),
			y: event.clientY - (canvas?.offsetTop || 0),
		};
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		setContext(canvas?.getContext("2d")); // Add null check

		if (
			(canvas && context && context.fillStyle !== bucketColor) ||
			(canvas && context && loadingFromLocalStorage)
		) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			context.fillStyle = bucketColor;
			context.fillRect(0, 0, canvas.width, canvas.height);
			setLoadingFromLocalStorage(false);

			for (let i = 0; i < drawnArray.length - 1; i++) {
				const line = drawnArray[i];
				const nextLine = drawnArray[i + 1];

				context.lineWidth = line.size;
				context.lineCap = "round";
				line.erase
					? (context.strokeStyle = bucketColor)
					: (context.strokeStyle = line.color);

				if (line.newStroke) {
					context.beginPath();
					context.moveTo(line.x, line.y);
				}

				if (!nextLine.newStroke) {
					context.lineTo(nextLine.x, nextLine.y);
					context.stroke();
				}
			}
			// reset to brush if we change background color and have eraser selected
			if (isEraser) {
				setIsEraser(false);
				setActiveTool("Brush");
				setBrushColor("#000000");
				setBrushCurrentSize(10);
			}
		}

		if (canvas && context && context.fillStyle === bucketColor) {
			const storeDrawn = function (
				x: any,
				y: any,
				size: any,
				color: any,
				erase: any,
				newStroke: any
			) {
				const line = {
					x,
					y,
					size,
					color,
					erase,
					newStroke,
				};

				const newDrawnArray = [...drawnArray, line];
				setDrawnArray(newDrawnArray);
			};

			const handleMouseDown = (event: MouseEvent) => {
				setIsMouseDown(true);
				const currentPosition = getMousePosition(event);
				if (currentPosition) {
					context.beginPath();
					context.moveTo(currentPosition.x, currentPosition.y);
					context.lineWidth = brushCurrentSize;
					context.lineCap = "round";
					context.strokeStyle = brushColor;
					storeDrawn(
						currentPosition.x,
						currentPosition.y,
						brushCurrentSize,
						brushColor,
						isEraser,
						true
					);
				}
			};

			const handleMouseMove = (event: MouseEvent) => {
				if (isMouseDown) {
					const currentPosition = getMousePosition(event);
					if (currentPosition) {
						context.lineTo(currentPosition.x, currentPosition.y);
						context.stroke();
						storeDrawn(
							currentPosition.x,
							currentPosition.y,
							brushCurrentSize,
							brushColor,
							isEraser,
							false
						);
					}
				}
			};

			const handleMouseUp = () => {
				setIsMouseDown(false);
			};

			canvas.addEventListener("mousedown", handleMouseDown);
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mouseup", handleMouseUp);

			return () => {
				canvas.removeEventListener("mousedown", handleMouseDown);
				canvas.removeEventListener("mousemove", handleMouseMove);
				canvas.removeEventListener("mouseup", handleMouseUp);
			};
		}
	}, [
		bucketColor,
		isMouseDown,
		isEraser,
		brushColor,
		brushCurrentSize,
		context,
		drawnArray,
		loadingFromLocalStorage,
	]);

	const brushSliderOnChange = (e: { target: { value: any } }) => {
		setBrushCurrentSize(e.target.value);
	};

	const handleEraserClick = () => {
		setIsEraser(true);
		setActiveTool("Eraser");
		setPreviousBrushSettings({ color: brushColor, size: brushCurrentSize });
		setBrushColor(bucketColor);
		setBrushCurrentSize(50);
	};

	const handleBrushClick = () => {
		setIsEraser(false);
		setActiveTool("Brush");
		setBrushColor(
			previousBrushSettings.color ? previousBrushSettings.color : "#000000"
		);
		setBrushCurrentSize(previousBrushSettings.size);
	};

	const delaySwitchToBrush = () => {
		setTimeout(() => {
			setActiveTool("Brush");
			setIsEraser(false);
			setBrushColor("#000000");
			setBrushCurrentSize(10);
		}, 2000);
	};

	const handleResetClick = () => {
		setDrawnArray([]);
		const canvas = canvasRef.current;
		if (context && canvas) {
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
			context.fillStyle = bucketColor;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
		setActiveTool("Canvas Cleared");

		delaySwitchToBrush();
	};

	const handleSaveClick = () => {
		localStorage.setItem("savedCanvas", JSON.stringify(drawnArray));
		setActiveTool("Canvas Saved");

		delaySwitchToBrush();
	};

	const handleLoadClick = () => {
		const savedCanvas = localStorage.getItem("savedCanvas");
		if (savedCanvas) {
			setDrawnArray(JSON.parse(savedCanvas));
			setLoadingFromLocalStorage(true);
			setActiveTool("Canvas Loaded");
		} else {
			setActiveTool("Canvas not found");
		}

		delaySwitchToBrush();
	};

	const handleClearClick = () => {
		localStorage.removeItem("savedCanvas");
		setActiveTool("Local Storage Cleared");

		delaySwitchToBrush();
	};

	const handleDownloadClick = () => {
		const canvas = canvasRef.current;
		const image = canvas?.toDataURL("image/jpeg", 1);
		const link = document.getElementById("download");
		if (link) {
			link.setAttribute("href", image as string);
			link.setAttribute("download", "paint-file.jpeg");
		}
		setActiveTool("Image Saved");

		delaySwitchToBrush();
	};

	return (
		<main>
			<div className="top-bar">
				{/* <!-- Active Tool --> */}
				<div className="active-tool">
					<span id="active-tool" title="Active Tool">
						{activeTool}
					</span>
				</div>
				{/* <!-- Brush --> */}
				<div className="brush tool">
					<FontAwesomeIcon
						onClick={handleBrushClick}
						className={`fas fa-brush ${activeTool === "Brush" ? "active" : ""}`}
						icon={faBrush}
						title="Brush"
						id="brush"
					/>
					<span
						ref={brushColorBoxRef}
						className="colorBox"
						style={{ backgroundColor: brushColor }}
						onClick={() => setBrushColorOpenToggle(!brushColorOpenToggle)}
					/>
					{brushColorOpenToggle && (
						<div ref={brushColorPickerRef} className="colorPicker">
							<HexColorPicker color={brushColor} onChange={setBrushColor} />
						</div>
					)}
					<HexColorInput
						prefixed={true}
						className="jscolor"
						color={brushColor}
						onChange={setBrushColor}
					/>
					<span className="size" id="brush-size" title="Brush Size">
						{brushCurrentSize < 10 ? `0${brushCurrentSize}` : brushCurrentSize}
					</span>
					<input
						id="brush-slider"
						className="slider"
						type="range"
						min="1"
						max="50"
						value={brushCurrentSize}
						onChange={brushSliderOnChange}
					/>
				</div>
				{/* <!-- Bucket --> */}
				<div className="bucket tool">
					<FontAwesomeIcon
						className="fas fa-fill-drip bucketIcon"
						title="Background Color"
						icon={faFillDrip}
					/>
					<span
						ref={bucketColorBoxRef}
						className="colorBox"
						style={{ backgroundColor: bucketColor }}
						onClick={() => setBucketColorOpenToggle(!bucketColorOpenToggle)}
					/>
					{bucketColorOpenToggle && (
						<div ref={bucketColorPickerRef} className="colorPicker">
							<HexColorPicker color={bucketColor} onChange={setBucketColor} />
						</div>
					)}
					<HexColorInput
						prefixed={true}
						id="bucket-color"
						className="jscolor"
						color={bucketColor}
						onChange={setBucketColor}
					/>
				</div>
				{/* <!-- Eraser --> */}
				<div className="tool">
					<FontAwesomeIcon
						onClick={handleEraserClick}
						className={`fas fa-eraser ${
							activeTool === "Eraser" ? "active" : ""
						}`}
						id="eraser"
						title="Eraser"
						icon={faEraser}
					/>
				</div>
				{/* <!-- Clear Canvas --> */}
				<div className="tool">
					<FontAwesomeIcon
						onClick={handleResetClick}
						className="fas fa-undo-alt"
						id="clear-canvas"
						title="Clear"
						icon={faUndoAlt}
					/>
				</div>
				{/* <!-- Save Local Storage --> */}
				<div className="tool">
					<FontAwesomeIcon
						className="fas fa-download"
						id="save-storage"
						title="Save Local Storage"
						icon={faDownload}
						onClick={handleSaveClick}
					/>
				</div>
				{/* <!-- Load Local Storage --> */}
				<div className="tool">
					<FontAwesomeIcon
						className="fas fa-upload"
						id="load-storage"
						title="Load Local Storage"
						icon={faUpload}
						onClick={handleLoadClick}
					/>
				</div>
				{/* <!-- Clear Local Storage --> */}
				<div className="tool">
					<FontAwesomeIcon
						className="fas fa-trash-alt"
						id="clear-storage"
						title="Clear Local Storage"
						icon={faTrashAlt}
						onClick={handleClearClick}
					/>
				</div>
				{/* <!-- Download Image --> */}
				<div className="tool">
					<a id="download">
						<FontAwesomeIcon
							className="far fa-save"
							title="Save Image File"
							icon={faFloppyDisk}
							onClick={handleDownloadClick}
						/>
					</a>
				</div>
			</div>
			<canvas
				ref={canvasRef}
				id="canvas"
				width="800"
				height="600"
				style={{
					border: "1px solid black",
					cursor: "crosshair",
					position: "absolute",
					zIndex: -1,
				}}
			/>
		</main>
	);
}
