import LayoutInteractor from './LayoutInteractor.js';
import DragPainter from './DragPainter.js';

class DragInteractor extends LayoutInteractor {

    constructor (context) {
        super(context);

        this._callerMouseEvent      =   null;
        this._initialMouseEvent     =   null;
        this._initialAnchor         =   null;
        this._lastMouseMoveEvent    =   null;
        this._isDragging            =   false;
        this._currentTransferrable  =   null;
        this._currentTargets        =   null;
        this._currentDropTarget     =   null;
        this._minTargetDistance     =   100;

    }

    get defaultPainter()            {return this._defaultPainter;}
    get currentTransferrable()      {return this._currentTransferrable;}
    get isDragging()                {return this._isDragging;}
    get currentTargets()            {return this._currentTargets;}
    get currentDropTarget()         {return this._currentDropTarget;}
    get minTargetDistance()         {return this._minTargetDistance;}
    set minTargetDistance(dist)     {this._minTargetDistance = dist;}
    
    startDraggingTransferrable (e, transferrableObject, anchor) {

        this.interactionManager.setInteractor(this);
        if (anchor==null) {

            anchor = {  x: this._lastMouseMoveEvent.clientX-this.layoutManager.rect.left-e.offsetX, 
                        y: this._lastMouseMoveEvent.clientY-this.layoutManager.rect.top-e.offsetY}; 

        }

        this._callerMouseEvent = e;
        this._initialMouseEvent = this._lastMouseMoveEvent;
        this._initialAnchor = anchor;
        this._isDragging = true;
        this._currentTransferrable = transferrableObject;
        this._currentTargets = this.layoutManager.getDropTargets (this.currentTransferrable.flavours);
        this.interactionLayer.show();
        this.currentTransferrable.onDragTransferrableStarted();
        this.mouseMove(e);
    }

    mouseDown (e) {

    }

    mouseUp (e) {

        if (this.currentTransferrable!=null&&this.currentDropTarget!=null) {
            this.currentTransferrable.onBeforeDrop(null);
            this.currentDropTarget.target.onDrop(this.currentTransferrable, this.currentDropTarget);
        } 

        this._isDragging = false;
        this._currentTransferrable = null;
        this._currentTargets = null;
        this._currentDropTarget = null;
        this.interactionLayer.hide();
        this.interactionManager.resetInteractor();
    }

    mouseMove (e) {

        this._lastMouseMoveEvent = e;
        if (!this._isDragging) return;

        let offset = {x: 0, y: 0};
        offset.x  = e.clientX - this._initialMouseEvent.clientX;
        offset.y = e.clientY - this._initialMouseEvent.clientY;

        let x = this._initialAnchor.x+offset.x;
        let y = this._initialAnchor.y+offset.y;
        
        this._currentDropTarget = this._getNearestTarget(e.clientX, e.clientY);
        this.currentTransferrable.onDragTransferrable();

        window.requestAnimationFrame(()=>{
            if (this.currentTransferrable==null) return;
            this.currentTransferrable.dragPainter.paintHelper(this.interactionLayer, x, y, this.currentTransferrable, this.currentDropTarget);
        });
    }

    _getNearestTarget (x, y) {

        if (this.currentTargets==null) return;
        let min = Number.MAX_SAFE_INTEGER;
        let target = null;

        this.currentTargets.forEach((t)=>{
            let dist = this._getDistance(x, y, t, this.minTargetDistance);
            if (dist<min) {
                min = dist;
                target = t;
            }
        });

        return target;
    }

    _getDistance (x, y, target, min) {

        let a = x - target.anchor.x;
        let b = y - target.anchor.y;
        
        let dist = Math.sqrt( a*a + b*b );
        return dist < min ? dist : Number.MAX_SAFE_INTEGER;

    }
}

export default DragInteractor;